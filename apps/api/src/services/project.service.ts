import { projectSchemas } from '@rialo-builder/shared';
import prisma from '../lib/prisma';
import logger from '../lib/logger';

export class ProjectService {
    async create(userId: string, data: projectSchemas.CreateProjectInput) {
        const project = await prisma.project.create({
            data: {
                userId,
                name: data.name,
                description: data.description,
            },
        });

        await prisma.auditLog.create({
            data: {
                userId,
                action: 'PROJECT_CREATED',
                resourceType: 'project',
                resourceId: project.id,
            },
        });

        logger.info('Project created', { projectId: project.id, userId });

        return project;
    }

    async findAllByUser(userId: string) {
        return prisma.project.findMany({
            where: {
                userId,
                deletedAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string, userId: string) {
        const project = await prisma.project.findFirst({
            where: {
                id,
                userId,
                deletedAt: null,
            },
            include: {
                workflows: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        return project;
    }

    async update(id: string, userId: string, data: projectSchemas.UpdateProjectInput) {
        const project = await prisma.project.findFirst({
            where: { id, userId, deletedAt: null },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        const updated = await prisma.project.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description,
            },
        });

        logger.info('Project updated', { projectId: id, userId });

        return updated;
    }

    async delete(id: string, userId: string) {
        const project = await prisma.project.findFirst({
            where: { id, userId, deletedAt: null },
        });

        if (!project) {
            throw new Error('Project not found');
        }

        await prisma.project.update({
            where: { id },
            data: { deletedAt: new Date() },
        });

        await prisma.auditLog.create({
            data: {
                userId,
                action: 'PROJECT_DELETED',
                resourceType: 'project',
                resourceId: id,
            },
        });

        logger.info('Project deleted', { projectId: id, userId });
    }
}
