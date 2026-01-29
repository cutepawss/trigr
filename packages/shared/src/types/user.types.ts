export interface User {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface RefreshToken {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
}

export interface AuditLog {
    id: string;
    userId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    details: Record<string, unknown> | null;
    ipAddress: string | null;
    createdAt: Date;
}
