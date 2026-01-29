import { workflowSchemas, nodeSchemas } from '@rialo-builder/shared';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

export class WorkflowService {
    async create(projectId: string, userId: string, data: workflowSchemas.CreateWorkflowInput) {
        const project = await prisma.project.findFirst({
            where: { id: projectId, userId, deletedAt: null },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        const workflow = await prisma.workflow.create({
            data: {
                projectId,
                name: data.name,
                description: data.description,
                status: 'draft',
            },
        });

        logger.info('Workflow created', { workflowId: workflow.id, projectId, userId });

        return workflow;
    }

    async findAllByProject(projectId: string, userId: string) {
        const project = await prisma.project.findFirst({
            where: { id: projectId, userId, deletedAt: null },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        return prisma.workflow.findMany({
            where: {
                projectId,
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string, userId: string) {
        const workflow = await prisma.workflow.findFirst({
            where: {
                id,
                deletedAt: null,
                project: {
                    userId,
                    deletedAt: null,
                },
            },
            include: {
                nodes: true,
                edges: true,
                project: true,
            },
        });

        if (!workflow) {
            throw new Error('Workflow not found');
        }

        return workflow;
    }

    async update(id: string, userId: string, data: workflowSchemas.UpdateWorkflowInput) {
        const workflow = await this.findById(id, userId);

        const updated = await prisma.workflow.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
                status: data.status,
            },
        });

        logger.info('Workflow updated', { workflowId: id, userId });

        return updated;
    }

    async delete(id: string, userId: string) {
        await this.findById(id, userId);

        await prisma.workflow.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        logger.info('Workflow deleted', { workflowId: id, userId });
    }

    async createNode(workflowId: string, userId: string, data: nodeSchemas.CreateNodeInput) {
        await this.findById(workflowId, userId);

        const existing = await prisma.workflowNode.findUnique({
            where: {
                workflowId_nodeId: {
                    workflowId,
                    nodeId: data.nodeId,
                },
            },
        });

        if (existing) {
            throw new Error('Node with this ID already exists');
        }

        const node = await prisma.workflowNode.create({
            data: {
                workflowId,
                nodeId: data.nodeId,
                type: data.type,
                config: data.config as any,
                position: data.position as any,
            },
        });

        logger.info('Node created', { nodeId: node.id, workflowId, userId });

        return node;
    }

    async updateNode(
        workflowId: string,
        nodeId: string,
        userId: string,
        data: nodeSchemas.UpdateNodeInput
    ) {
        await this.findById(workflowId, userId);

        const node = await prisma.workflowNode.findUnique({
            where: {
                workflowId_nodeId: {
                    workflowId,
                    nodeId,
                },
            },
        });

        if (!node) {
            throw new Error('Node not found');
        }

        const updated = await prisma.workflowNode.update({
            where: { id: node.id },
            data: {
                ...(data.config && { config: data.config as any }),
                ...(data.position && { position: data.position as any }),
            },
        });

        logger.info('Node updated', { nodeId: updated.id, workflowId, userId });

        return updated;
    }

    async deleteNode(workflowId: string, nodeId: string, userId: string) {
        await this.findById(workflowId, userId);

        const node = await prisma.workflowNode.findUnique({
            where: {
                workflowId_nodeId: {
                    workflowId,
                    nodeId,
                },
            },
        });

        if (!node) {
            throw new Error('Node not found');
        }

        await prisma.workflowNode.delete({
            where: { id: node.id },
        });

        await prisma.workflowEdge.deleteMany({
            where: {
                workflowId,
                OR: [{ sourceNodeId: nodeId }, { targetNodeId: nodeId }],
            },
        });

        logger.info('Node deleted', { nodeId: node.id, workflowId, userId });
    }

    async createEdge(workflowId: string, userId: string, data: nodeSchemas.CreateEdgeInput) {
        await this.findById(workflowId, userId);

        const existing = await prisma.workflowEdge.findUnique({
            where: {
                workflowId_sourceNodeId_targetNodeId: {
                    workflowId,
                    sourceNodeId: data.sourceNodeId,
                    targetNodeId: data.targetNodeId,
                },
            },
        });

        if (existing) {
            throw new Error('Edge already exists');
        }

        const edge = await prisma.workflowEdge.create({
            data: {
                workflowId,
                sourceNodeId: data.sourceNodeId,
                targetNodeId: data.targetNodeId,
            },
        });

        logger.info('Edge created', { edgeId: edge.id, workflowId, userId });

        return edge;
    }

    async deleteEdge(workflowId: string, edgeId: string, userId: string) {
        await this.findById(workflowId, userId);

        const edge = await prisma.workflowEdge.findFirst({
            where: {
                id: edgeId,
                workflowId,
            },
        });

        if (!edge) {
            throw new Error('Edge not found');
        }

        await prisma.workflowEdge.delete({
            where: { id: edgeId },
        });

        logger.info('Edge deleted', { edgeId, workflowId, userId });
    }
}
