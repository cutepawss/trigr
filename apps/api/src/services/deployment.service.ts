import { MockRialoClient, DeploymentArtifact } from '@rialo-builder/shared';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

export class DeploymentService {
    private rialoClient: MockRialoClient;

    constructor() {
        this.rialoClient = new MockRialoClient();
    }

    async deploy(workflowId: string, userId: string, compiledCode: string) {
        const workflow = await prisma.workflow.findFirst({
            where: {
                id: workflowId,
                deletedAt: null,
                project: {
                    userId,
                    deletedAt: null,
                },
            },
        });

        if (!workflow) {
            throw new Error('Workflow not found');
        }

        const artifact: DeploymentArtifact = {
            workflowId,
            compiledCode,
            metadata: {
                version: '1.0.0',
                compiler: 'rialo-builder-mvp',
                timestamp: Date.now(),
            },
        };

        const result = await this.rialoClient.deployReactiveTransaction(artifact);

        const deployment = await prisma.deployment.create({
            data: {
                workflowId,
                status: result.status,
                txHash: result.txHash,
                contractAddress: result.contractAddress,
                compiledArtifact: compiledCode,
            },
        });

        await prisma.auditLog.create({
            data: {
                userId,
                action: 'WORKFLOW_DEPLOYED',
                resourceType: 'deployment',
                resourceId: deployment.id,
                details: {
                    workflowId,
                    txHash: result.txHash,
                    contractAddress: result.contractAddress,
                },
            },
        });

        logger.info('Workflow deployed', {
            deploymentId: deployment.id,
            workflowId,
            txHash: result.txHash,
            userId,
        });

        return deployment;
    }

    async getDeploymentStatus(deploymentId: string, userId: string) {
        const deployment = await prisma.deployment.findFirst({
            where: {
                id: deploymentId,
                workflow: {
                    project: {
                        userId,
                        deletedAt: null,
                    },
                },
            },
        });

        if (!deployment || !deployment.txHash) {
            throw new Error('Deployment not found');
        }

        const status = await this.rialoClient.getDeploymentStatus(deployment.txHash);

        if (status.status !== deployment.status) {
            await prisma.deployment.update({
                where: { id: deploymentId },
                data: { status: status.status },
            });
        }

        return {
            ...deployment,
            status: status.status,
            blockNumber: status.blockNumber,
        };
    }

    async getExecutions(deploymentId: string, userId: string, cursor?: string) {
        const deployment = await prisma.deployment.findFirst({
            where: {
                id: deploymentId,
                workflow: {
                    project: {
                        userId,
                        deletedAt: null,
                    },
                },
            },
        });

        if (!deployment || !deployment.contractAddress) {
            throw new Error('Deployment not found');
        }

        const result = await this.rialoClient.listExecutions(deployment.contractAddress, cursor);

        // Store executions in database
        for (const execution of result.executions) {
            const existingIndex = await prisma.execution.findFirst({
                where: {
                    deploymentId,
                    executionIndex: parseInt(execution.executionId.split('_')[1]),
                },
            });

            if (!existingIndex) {
                await prisma.execution.create({
                    data: {
                        deploymentId,
                        executionIndex: parseInt(execution.executionId.split('_')[1]),
                        status: execution.status,
                        inputState: execution.inputState as any,
                        outputState: execution.outputState as any,
                        gasUsed: execution.gasUsed,
                        trace: { executionId: execution.executionId } as any,
                    },
                });
            }
        }

        return result;
    }
}
