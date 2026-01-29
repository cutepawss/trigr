import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma';

// Mock Prisma
vi.mock('../src/lib/prisma', () => ({
    default: {
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        refreshToken: {
            create: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
        },
    },
}));

describe('Auth Routes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new user', async () => {
            const mockUser = {
                id: 'test-user-id',
                email: 'test@example.com',
                createdAt: new Date(),
            };

            (prisma.user.findUnique as any).mockResolvedValue(null);
            (prisma.user.create as any).mockResolvedValue(mockUser);
            (prisma.refreshToken.create as any).mockResolvedValue({});
            (prisma.auditLog.create as any).mockResolvedValue({});

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe('test@example.com');
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });

        it('should reject invalid email format', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'SecurePass123!',
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        });

        it('should reject weak password', async () => {
            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: '123',
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject duplicate email', async () => {
            (prisma.user.findUnique as any).mockResolvedValue({
                id: 'existing-user',
                email: 'test@example.com',
            });

            const response = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login existing user', async () => {
            const mockUser = {
                id: 'test-user-id',
                email: 'test@example.com',
                passwordHash: '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', // 'password'
            };

            (prisma.user.findUnique as any).mockResolvedValue(mockUser);
            (prisma.refreshToken.create as any).mockResolvedValue({});
            (prisma.auditLog.create as any).mockResolvedValue({});

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password',
                })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
        });

        it('should reject invalid credentials', async () => {
            (prisma.user.findUnique as any).mockResolvedValue(null);

            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password',
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
        });
    });
});
