import bcrypt from 'bcryptjs';
import { authSchemas } from '@rialo-builder/shared';
import prisma from '../lib/prisma';
import { generateAccessToken, generateRefreshToken } from '../lib/jwt';
import logger from '../lib/logger';

export class AuthService {
    async register(data: authSchemas.RegisterInput, ipAddress?: string) {
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new Error('User already exists');
        }

        const passwordHash = await bcrypt.hash(data.password, 10);

        const user = await prisma.user.create({
            data: {
                email: data.email,
                passwordHash,
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        });

        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'USER_REGISTERED',
                resourceType: 'user',
                resourceId: user.id,
                ipAddress,
            },
        });

        logger.info('User registered', { userId: user.id, email: user.email });

        const accessToken = generateAccessToken({ userId: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: hashedRefreshToken,
                expiresAt,
            },
        });

        return {
            user,
            accessToken,
            refreshToken,
        };
    }

    async login(data: authSchemas.LoginInput, ipAddress?: string) {
        const user = await prisma.user.findUnique({
            where: { email: data.email, deletedAt: null },
        });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const validPassword = await bcrypt.compare(data.password, user.passwordHash);

        if (!validPassword) {
            throw new Error('Invalid credentials');
        }

        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'USER_LOGIN',
                resourceType: 'user',
                resourceId: user.id,
                ipAddress,
            },
        });

        logger.info('User logged in', { userId: user.id, email: user.email });

        const accessToken = generateAccessToken({ userId: user.id, email: user.email });
        const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                token: hashedRefreshToken,
                expiresAt,
            },
        });

        return {
            user: {
                id: user.id,
                email: user.email,
            },
            accessToken,
            refreshToken,
        };
    }

    async refresh(data: authSchemas.RefreshTokenInput) {
        const tokens = await prisma.refreshToken.findMany({
            where: {
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });

        let matchedToken = null;
        for (const token of tokens) {
            const isValid = await bcrypt.compare(data.refreshToken, token.token);
            if (isValid) {
                matchedToken = token;
                break;
            }
        }

        if (!matchedToken) {
            throw new Error('Invalid refresh token');
        }

        await prisma.refreshToken.update({
            where: { id: matchedToken.id },
            data: { revokedAt: new Date() },
        });

        const accessToken = generateAccessToken({
            userId: matchedToken.user.id,
            email: matchedToken.user.email,
        });
        const refreshToken = generateRefreshToken({
            userId: matchedToken.user.id,
            email: matchedToken.user.email,
        });

        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.refreshToken.create({
            data: {
                userId: matchedToken.user.id,
                token: hashedRefreshToken,
                expiresAt,
            },
        });

        logger.info('Token refreshed', { userId: matchedToken.user.id });

        return {
            accessToken,
            refreshToken,
        };
    }

    async logout(userId: string, refreshToken: string) {
        const tokens = await prisma.refreshToken.findMany({
            where: {
                userId,
                revokedAt: null,
            },
        });

        for (const token of tokens) {
            const isValid = await bcrypt.compare(refreshToken, token.token);
            if (isValid) {
                await prisma.refreshToken.update({
                    where: { id: token.id },
                    data: { revokedAt: new Date() },
                });
                break;
            }
        }

        logger.info('User logged out', { userId });
    }
}
