import { RialoClient, DeploymentArtifact } from './rialo-client.interface';
import {
    CompiledWorkflow,
    GasEstimate,
    DeploymentResult,
    DeploymentStatusInfo,
    ExecutionRecord,
} from '../types';
import { GAS_CONSTANTS, DEPLOYMENT_STATUS, EXECUTION_STATUS } from '../constants';

export class MockRialoClient implements RialoClient {
    private deployments: Map<string, DeploymentStatusInfo> = new Map();
    private executions: Map<string, ExecutionRecord[]> = new Map();
    private deploymentCounter = 0;
    private executionCounter = 0;

    async estimateGas(workflow: CompiledWorkflow): Promise<GasEstimate> {
        const breakdown = {
            base: GAS_CONSTANTS.BASE_COST,
            nodes: 0,
            storageWrites: 0,
            externalCalls: 0,
            conditions: workflow.conditions.length * GAS_CONSTANTS.CONDITION_EVALUATION,
        };

        const totalNodes = 1 + workflow.conditions.length + workflow.actions.length;
        breakdown.nodes = totalNodes * GAS_CONSTANTS.PER_NODE;
        breakdown.storageWrites = workflow.actions.length * GAS_CONSTANTS.STORAGE_WRITE;

        workflow.actions.forEach(action => {
            const config = action.config as any;
            if (config.actionType === 'contract_call') {
                breakdown.externalCalls += GAS_CONSTANTS.EXTERNAL_CALL;
            }
        });

        const total =
            breakdown.base +
            breakdown.nodes +
            breakdown.storageWrites +
            breakdown.externalCalls +
            breakdown.conditions;

        return {
            total,
            breakdown,
            workflowId: workflow.workflowId,
            estimatedAt: new Date(),
        };
    }

    async deployReactiveTransaction(artifact: DeploymentArtifact): Promise<DeploymentResult> {
        this.deploymentCounter++;
        const txHash = `0x${this.generateRandomHash()}`;
        const contractAddress = `0x${this.generateRandomAddress()}`;

        const deploymentInfo: DeploymentStatusInfo = {
            status: DEPLOYMENT_STATUS.PENDING,
            txHash,
            contractAddress,
            blockNumber: undefined,
        };

        this.deployments.set(txHash, deploymentInfo);

        setTimeout(() => {
            const info = this.deployments.get(txHash);
            if (info) {
                info.status = DEPLOYMENT_STATUS.CONFIRMED;
                info.blockNumber = Math.floor(Math.random() * 1000000) + 1000000;
                this.deployments.set(txHash, info);
                this.createMockExecutions(contractAddress);
            }
        }, 2000);

        return {
            txHash,
            contractAddress,
            status: DEPLOYMENT_STATUS.PENDING,
        };
    }

    async getDeploymentStatus(txHash: string): Promise<DeploymentStatusInfo> {
        const deployment = this.deployments.get(txHash);
        if (!deployment) {
            throw new Error(`Deployment not found for txHash: ${txHash}`);
        }
        return deployment;
    }

    async listExecutions(
        contractAddress: string,
        cursor?: string
    ): Promise<{
        executions: ExecutionRecord[];
        nextCursor?: string;
    }> {
        let executions = this.executions.get(contractAddress) || [];

        if (cursor) {
            const cursorIndex = executions.findIndex(e => e.executionId === cursor);
            if (cursorIndex >= 0) {
                executions = executions.slice(cursorIndex + 1);
            }
        }

        const pageSize = 10;
        const page = executions.slice(0, pageSize);
        const hasMore = executions.length > pageSize;

        return {
            executions: page,
            nextCursor: hasMore ? page[page.length - 1].executionId : undefined,
        };
    }

    private createMockExecutions(contractAddress: string): void {
        const executions: ExecutionRecord[] = [];
        const numExecutions = Math.floor(Math.random() * 5) + 3;

        for (let i = 0; i < numExecutions; i++) {
            this.executionCounter++;
            executions.push({
                executionId: `exec_${this.executionCounter}`,
                status: Math.random() > 0.1 ? EXECUTION_STATUS.SUCCESS : EXECUTION_STATUS.FAILED,
                inputState: { account: { balance: 1000 + i * 100 } },
                outputState: { account: { balance: 1000 + i * 100 + 50 } },
                gasUsed: 50000 + Math.floor(Math.random() * 10000),
                timestamp: Date.now() - (numExecutions - i) * 60000,
            });
        }

        this.executions.set(contractAddress, executions);
    }

    private generateRandomHash(): string {
        return Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    private generateRandomAddress(): string {
        return Array.from({ length: 40 }, () =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }
}
