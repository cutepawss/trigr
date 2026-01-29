import { Router } from 'express';
import { authSchemas } from '@rialo-builder/shared';
import { AuthService } from '../services/auth.service';
import { validate } from '../middleware/validation.middleware';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { authRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();
const authService = new AuthService();

router.post(
    '/register',
    authRateLimiter,
    validate(authSchemas.registerSchema),
    async (req, res, next) => {
        try {
            const result = await authService.register(req.body, req.ip);
            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            next(error);
        }
    }
);

router.post(
    '/login',
    authRateLimiter,
    validate(authSchemas.loginSchema),
    async (req, res, next) => {
        try {
            const result = await authService.login(req.body, req.ip);
            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid email or password',
                },
            });
        }
    }
);

router.post(
    '/refresh',
    validate(authSchemas.refreshTokenSchema),
    async (req, res, next) => {
        try {
            const result = await authService.refresh(req.body);
            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_REFRESH_TOKEN',
                    message: 'Invalid or expired refresh token',
                },
            });
        }
    }
);

router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
    try {
        const { refreshToken } = req.body;
        await authService.logout(req.user!.id, refreshToken);
        res.json({
            success: true,
            data: { message: 'Logged out successfully' },
        });
    } catch (error: any) {
        next(error);
    }
});

export default router;
