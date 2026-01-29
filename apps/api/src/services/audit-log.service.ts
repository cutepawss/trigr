import prisma from '../lib/prisma';

export class AuditLogService {
    async log(data: {
        userId?: string;
        action: string;
        resourceType: string;
        resourceId?: string;
        details?: Record<string, unknown>;
        ipAddress?: string;
    }) {
        return prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                resourceType: data.resourceType,
                resourceId: data.resourceId,
                details: data.details as any,
                ipAddress: data.ipAddress,
            },
        });
    }

    async findByUser(userId: string, limit = 100) {
        return prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
