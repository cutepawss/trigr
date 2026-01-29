/* ============================================
   INTENT ROUTES
   API endpoints for intent management
   ============================================ */

import { Router, Request, Response, NextFunction } from 'express';
import IntentService from '../services/intent.service';
import SecurityService from '../services/security.service';
import OracleService from '../services/oracle.service';
import { getReactiveEngine } from '../services/reactive-engine.service';
import { CreateIntentInput } from '../types/intent.types';

const router = Router();

/* ============================================
   ENGINE MONITORING ENDPOINTS
   ============================================ */

/**
 * GET /intents/engine/status
 * Get reactive execution engine status
 */
router.get('/engine/status', (_req: Request, res: Response) => {
    try {
        const engine = getReactiveEngine();
        const stats = engine.getStats();

        res.json({
            success: true,
            data: {
                running: stats.running,
                uptime: stats.uptime,
                uptimeFormatted: formatUptime(stats.uptime),
                lastTickAt: stats.lastTickAt,
                tickCount: stats.tickCount,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message },
        });
    }
});

/**
 * GET /intents/engine/stats
 * Get reactive execution engine statistics
 */
router.get('/engine/stats', (_req: Request, res: Response) => {
    try {
        const engine = getReactiveEngine();
        const stats = engine.getStats();

        res.json({
            success: true,
            data: {
                running: stats.running,
                totalProcessed: stats.totalProcessed,
                totalExecuted: stats.totalExecuted,
                totalFailed: stats.totalFailed,
                totalExpired: stats.totalExpired,
                successRate: stats.totalProcessed > 0
                    ? ((stats.totalExecuted / stats.totalProcessed) * 100).toFixed(1) + '%'
                    : '100%',
                uptime: stats.uptime,
                tickCount: stats.tickCount,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message },
        });
    }
});

// Helper function to format uptime
function formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}

// Extended request type with user
interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

/* ============================================
   MIDDLEWARE
   ============================================ */

// Simple auth middleware (reuse from existing)
const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    // In production, verify JWT token
    // For demo, accept any request with a user header
    const userId = req.headers['x-user-id'] as string || 'demo-user';
    req.user = { id: userId, email: 'demo@example.com' };
    next();
};

// Rate limit middleware
const rateLimitMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.id || 'anonymous';
    const { allowed, remaining, resetIn } = SecurityService.checkRateLimit(userId);

    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetIn / 1000).toString());

    if (!allowed) {
        return res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Too many requests. Please try again later.',
                resetIn: Math.ceil(resetIn / 1000),
            },
        });
    }

    next();
};

/* ============================================
   ROUTES
   ============================================ */

/**
 * GET /intents/prices/:token
 * Get current price for a token (PUBLIC - no auth, no rate limit)
 * IMPORTANT: This must come BEFORE /:id route
 */
router.get('/prices/:token', async (req: Request, res: Response) => {
    try {
        const { price, twap, sources, deviation, isValid, errors } =
            await OracleService.getValidatedPrice(req.params.token);

        res.json({
            success: true,
            data: {
                price,
                twap,
                sources,
                deviation: (deviation * 100).toFixed(4) + '%',
                isValid,
                warnings: errors,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message },
        });
    }
});

/**
 * GET /intents/nonce/:address
 * Get current nonce for an address (PUBLIC)
 */
router.get('/nonce/:address', async (req: Request, res: Response) => {
    try {
        const nonce = SecurityService.getNonce(req.params.address);

        res.json({
            success: true,
            data: { nonce },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message },
        });
    }
});

/**
 * GET /intents
 * Get all intents for authenticated user
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const intents = await IntentService.getByUser(req.user!.id);
        const stats = await IntentService.getStats(req.user!.id);

        res.json({
            success: true,
            data: {
                intents,
                stats,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message },
        });
    }
});

/**
 * GET /intents/:id
 * Get a specific intent
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const intent = await IntentService.getById(req.params.id);

        if (!intent) {
            return res.status(404).json({
                success: false,
                error: { message: 'Intent not found' },
            });
        }

        if (intent.userId !== req.user!.id) {
            return res.status(403).json({
                success: false,
                error: { message: 'Access denied' },
            });
        }

        res.json({
            success: true,
            data: intent,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message },
        });
    }
});

/**
 * POST /intents
 * Create a new intent
 */
router.post('/', authMiddleware, rateLimitMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const input: CreateIntentInput = req.body;

        // Validate input
        if (!input.type || !input.tokenIn || !input.tokenOut || !input.amountIn) {
            return res.status(400).json({
                success: false,
                error: { message: 'Missing required fields: type, tokenIn, tokenOut, amountIn' },
            });
        }

        // Validate slippage
        const slippage = parseFloat(input.slippage || '2');
        if (!SecurityService.validateSlippage(slippage)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Slippage must be between 0 and 3%' },
            });
        }

        // Validate amount
        if (!SecurityService.validateAmount(input.amountIn)) {
            return res.status(400).json({
                success: false,
                error: { message: 'Invalid amount' },
            });
        }

        // Validate target price for limit orders (must be within ±10% of market)
        // For limit/stop-loss orders, we're tracking the price of tokenIn (what we're selling)
        // e.g., sell ETH when ETH drops to $X -> check ETH price
        if (input.type === 'limit' && input.targetPrice) {
            // Use tokenIn for stop-loss/sell orders (tracking the asset we're selling)
            const priceToken = input.tokenIn;
            const priceData = await OracleService.getValidatedPrice(priceToken);
            const marketPrice = parseFloat(priceData.price.price);
            const targetPrice = parseFloat(input.targetPrice);

            const deviation = Math.abs(targetPrice - marketPrice) / marketPrice;
            if (deviation > 0.10) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'PRICE_OUT_OF_RANGE',
                        message: `Target price must be within ±10% of market price ($${marketPrice.toFixed(2)}). Current deviation: ${(deviation * 100).toFixed(1)}%`
                    },
                });
            }
        }

        // Create intent
        const intent = await IntentService.create(req.user!.id, {
            ...input,
            slippage: slippage.toString(),
            deadline: input.deadline || 24,
        });

        res.status(201).json({
            success: true,
            data: intent,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message },
        });
    }
});

/**
 * POST /intents/:id/simulate
 * Simulate intent execution
 */
router.post('/:id/simulate', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const simulation = await IntentService.simulate(req.params.id);

        res.json({
            success: true,
            data: simulation,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message },
        });
    }
});

/**
 * DELETE /intents/:id
 * Cancel an intent
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const intent = await IntentService.cancel(req.params.id, req.user!.id);

        if (!intent) {
            return res.status(404).json({
                success: false,
                error: { message: 'Intent not found or cannot be cancelled' },
            });
        }

        res.json({
            success: true,
            data: intent,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message },
        });
    }
});

/**
 * POST /intents/commit
 * Commit an intent hash (MEV protection)
 */
router.post('/commit', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { hash } = req.body;

        if (!hash) {
            return res.status(400).json({
                success: false,
                error: { message: 'Hash is required' },
            });
        }

        SecurityService.commitIntent(req.user!.id, hash);

        res.json({
            success: true,
            data: { committed: true },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message },
        });
    }
});

/**
 * DELETE /intents/:id
 * Cancel an intent (only pending/active)
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const intent = await IntentService.cancel(req.params.id, req.user!.id);

        if (!intent) {
            return res.status(404).json({
                success: false,
                error: { code: 'INTENT_NOT_FOUND', message: 'Intent not found or cannot be cancelled' },
            });
        }

        res.json({
            success: true,
            data: intent,
            message: 'Intent cancelled successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message },
        });
    }
});

/**
 * PUT /intents/:id
 * Edit an intent (only pending/active)
 */
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const { targetPrice, slippage, amountIn } = req.body;

        const intent = await IntentService.getById(req.params.id);

        if (!intent) {
            return res.status(404).json({
                success: false,
                error: { code: 'INTENT_NOT_FOUND', message: 'Intent not found' },
            });
        }

        if (intent.userId !== req.user!.id) {
            return res.status(403).json({
                success: false,
                error: { code: 'ACCESS_DENIED', message: 'Access denied' },
            });
        }

        if (intent.status === 'executed' || intent.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                error: { code: 'INTENT_IMMUTABLE', message: 'Cannot edit executed or cancelled intents' },
            });
        }

        // Validate new target price if provided (for limit orders)
        // Use tokenIn for price check (the asset being sold/tracked)
        if (targetPrice && intent.type === 'limit') {
            const priceData = await OracleService.getValidatedPrice(intent.tokenIn);
            const marketPrice = parseFloat(priceData.price.price);
            const newTarget = parseFloat(targetPrice);

            const deviation = Math.abs(newTarget - marketPrice) / marketPrice;
            if (deviation > 0.10) { // 10% max deviation
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'PRICE_OUT_OF_RANGE',
                        message: `Target price must be within ±10% of market price ($${marketPrice.toFixed(2)})`
                    },
                });
            }
        }

        // Apply updates
        const updated = await IntentService.updateIntent(req.params.id, {
            targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
            slippage: slippage ? parseFloat(slippage) : undefined,
            amountIn: amountIn || undefined,
        });

        res.json({
            success: true,
            data: updated,
            message: 'Intent updated successfully',
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: { message: error.message },
        });
    }
});

export default router;
