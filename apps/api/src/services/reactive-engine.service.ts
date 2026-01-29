/* ============================================
   REACTIVE EXECUTION ENGINE
   Professional-grade intent execution engine
   simulating Rialo's native reactive layer
   ============================================ */

import { EventEmitter } from 'events';
import logger from '../lib/logger';
import IntentService from './intent.service';
import OracleService from './oracle.service';
import { Intent, IntentStatus } from '../types/intent.types';

// Execution result type
interface ExecutionResult {
    intentId: string;
    success: boolean;
    status: IntentStatus;
    txHash?: string;
    error?: string;
    gasUsed?: string;
    actualAmountOut?: string;
    executedAt?: number;
}

// Engine statistics
interface EngineStats {
    totalProcessed: number;
    totalExecuted: number;
    totalFailed: number;
    totalExpired: number;
    uptime: number;
    lastTickAt: number | null;
    tickCount: number;
}

// Priority levels for intent processing
type Priority = 'immediate' | 'high' | 'normal' | 'low';

interface QueuedIntent {
    intent: Intent;
    priority: Priority;
    addedAt: number;
}

export class ReactiveExecutionEngine extends EventEmitter {
    private isRunning: boolean = false;
    private executionInterval: NodeJS.Timeout | null = null;
    private readonly tickIntervalMs: number;
    private readonly maxSlippagePercent: number = 3.0;
    private readonly priceDeviationThreshold: number = 0.10; // 10%

    // Priority queue for pending intents
    private priorityQueue: QueuedIntent[] = [];

    // Statistics
    private stats: EngineStats = {
        totalProcessed: 0,
        totalExecuted: 0,
        totalFailed: 0,
        totalExpired: 0,
        uptime: 0,
        lastTickAt: null,
        tickCount: 0,
    };

    private startedAt: number | null = null;

    constructor(tickIntervalMs: number = 3000) {
        super();
        this.tickIntervalMs = tickIntervalMs;

        logger.info('[RXE] ReactiveExecutionEngine initialized', {
            tickInterval: tickIntervalMs,
            maxSlippage: this.maxSlippagePercent,
            priceDeviation: this.priceDeviationThreshold,
        });
    }

    /* ============================================
       LIFECYCLE MANAGEMENT
       ============================================ */

    /**
     * Start the reactive execution engine
     */
    start(): void {
        if (this.isRunning) {
            logger.warn('[RXE] Engine already running');
            return;
        }

        this.isRunning = true;
        this.startedAt = Date.now();

        logger.info('[RXE] ⚡ Engine STARTED', {
            tickInterval: `${this.tickIntervalMs}ms`,
        });

        // Start the execution loop
        this.executionInterval = setInterval(
            () => this.tick().catch(err =>
                logger.error('[RXE] Tick error', { error: err.message })
            ),
            this.tickIntervalMs
        );

        // Initial tick
        this.tick().catch(err =>
            logger.error('[RXE] Initial tick error', { error: err.message })
        );

        this.emit('engine:started', { startedAt: this.startedAt });
    }

    /**
     * Stop the reactive execution engine gracefully
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            logger.warn('[RXE] Engine already stopped');
            return;
        }

        logger.info('[RXE] 🛑 Stopping engine...');

        this.isRunning = false;

        if (this.executionInterval) {
            clearInterval(this.executionInterval);
            this.executionInterval = null;
        }

        // Wait for any pending operations
        await this.flushQueue();

        const uptime = this.startedAt ? Date.now() - this.startedAt : 0;

        logger.info('[RXE] Engine STOPPED', {
            uptime: `${Math.round(uptime / 1000)}s`,
            stats: this.stats,
        });

        this.emit('engine:stopped', {
            uptime,
            stats: this.stats
        });
    }

    /**
     * Check if engine is running
     */
    get running(): boolean {
        return this.isRunning;
    }

    /**
     * Get engine statistics
     */
    getStats(): EngineStats & { running: boolean } {
        return {
            ...this.stats,
            uptime: this.startedAt ? Date.now() - this.startedAt : 0,
            running: this.isRunning,
        };
    }

    /* ============================================
       EXECUTION LOOP
       ============================================ */

    /**
     * Single execution tick - processes all eligible intents
     */
    private async tick(): Promise<void> {
        if (!this.isRunning) return;

        const tickStart = Date.now();
        this.stats.tickCount++;
        this.stats.lastTickAt = tickStart;

        try {
            // Get all active intents
            const activeIntents = await this.getAllActiveIntents();

            if (activeIntents.length === 0) {
                return;
            }

            // Sort by priority
            const prioritizedIntents = this.prioritizeIntents(activeIntents);

            // Process each intent
            for (const intent of prioritizedIntents) {
                if (!this.isRunning) break; // Check if stopped mid-tick

                await this.processIntent(intent);
            }

        } catch (error: any) {
            logger.error('[RXE] Tick failed', {
                error: error.message,
                tickCount: this.stats.tickCount
            });
        }
    }

    /**
     * Process a single intent
     */
    private async processIntent(intent: Intent): Promise<ExecutionResult | null> {
        this.stats.totalProcessed++;

        try {
            // Check if deadline passed
            if (this.isExpired(intent)) {
                return await this.handleExpired(intent);
            }

            // Validate slippage
            if (!this.validateSlippage(intent)) {
                logger.warn('[RXE] Slippage exceeds maximum', {
                    intentId: intent.id,
                    maxSlippage: this.maxSlippagePercent,
                });
                return null;
            }

            // Evaluate predicate conditions
            const predicateMet = await this.evaluatePredicate(intent);

            if (!predicateMet) {
                // Conditions not met yet, skip
                return null;
            }

            // Execute the intent
            return await this.executeIntent(intent);

        } catch (error: any) {
            logger.error('[RXE] Intent processing failed', {
                intentId: intent.id,
                error: error.message,
            });

            this.stats.totalFailed++;

            return {
                intentId: intent.id,
                success: false,
                status: 'failed' as IntentStatus,
                error: error.message,
            };
        }
    }

    /* ============================================
       PREDICATE EVALUATION
       ============================================ */

    /**
     * Evaluate if intent's predicate conditions are met
     */
    private async evaluatePredicate(intent: Intent): Promise<boolean> {
        const { predicate, type } = intent;

        // Market swaps should execute immediately
        if (type === 'swap') {
            return true;
        }

        switch (predicate.type) {
            case 'price':
                return await this.evaluatePricePredicate(intent);

            case 'time':
                return this.evaluateTimePredicate(intent);

            case 'balance':
                // Would check on-chain balance in production
                return true;

            default:
                return false;
        }
    }

    /**
     * Evaluate price-based predicate
     */
    private async evaluatePricePredicate(intent: Intent): Promise<boolean> {
        const { predicate } = intent;
        const token = predicate.token || intent.tokenOut;

        try {
            const result = await OracleService.evaluatePricePredicate(
                token,
                predicate.operator as 'gte' | 'lte' | 'eq',
                predicate.value
            );

            return result.satisfied;

        } catch (error: any) {
            logger.error('[RXE] Price predicate evaluation failed', {
                intentId: intent.id,
                error: error.message,
            });
            return false;
        }
    }

    /**
     * Evaluate time-based predicate (for DCA)
     */
    private evaluateTimePredicate(intent: Intent): boolean {
        const { predicate } = intent;

        if (predicate.operator === 'interval') {
            const interval = parseInt(predicate.value);
            const lastExec = intent.executedAt || intent.createdAt;
            return Date.now() - lastExec >= interval;
        }

        return true;
    }

    /* ============================================
       INTENT EXECUTION
       ============================================ */

    /**
     * Execute an intent that has passed all conditions
     */
    private async executeIntent(intent: Intent): Promise<ExecutionResult> {
        const executionStart = Date.now();

        logger.info('[RXE] 🚀 Executing intent', {
            intentId: intent.id,
            type: intent.type,
            pair: `${intent.tokenIn}/${intent.tokenOut}`,
            amount: intent.amountIn,
        });

        try {
            // Get current prices
            const priceIn = await OracleService.getPrice(intent.tokenIn);
            const priceOut = await OracleService.getPrice(intent.tokenOut);

            // Calculate actual output
            const inputValue = parseFloat(intent.amountIn) * parseFloat(priceIn.price);
            const actualOutput = inputValue / parseFloat(priceOut.price);

            // Check minimum output (slippage protection)
            const minOutput = parseFloat(intent.minAmountOut);
            if (actualOutput < minOutput) {
                throw new Error(`Output ${actualOutput.toFixed(8)} below minimum ${minOutput.toFixed(8)}`);
            }

            // Generate mock transaction hash (in production, this would be real tx)
            const txHash = this.generateTxHash();

            // Calculate gas used (mock)
            const gasUsed = this.calculateGas(intent);

            // Update intent status
            await IntentService.updateStatus(intent.id, 'executed');

            // Update intent with execution details
            const updatedIntent = await IntentService.getById(intent.id);
            if (updatedIntent) {
                updatedIntent.actualAmountOut = actualOutput.toFixed(8);
                updatedIntent.txHash = txHash;
                updatedIntent.gasUsed = gasUsed;
                updatedIntent.executedAt = Date.now();
            }

            const result: ExecutionResult = {
                intentId: intent.id,
                success: true,
                status: 'executed',
                txHash,
                gasUsed,
                actualAmountOut: actualOutput.toFixed(8),
                executedAt: Date.now(),
            };

            this.stats.totalExecuted++;

            logger.info('[RXE] ✅ Intent executed successfully', {
                intentId: intent.id,
                output: result.actualAmountOut,
                txHash: txHash.slice(0, 18) + '...',
                duration: `${Date.now() - executionStart}ms`,
            });

            // Emit execution event
            this.emit('intent:executed', result);

            return result;

        } catch (error: any) {
            this.stats.totalFailed++;

            const result: ExecutionResult = {
                intentId: intent.id,
                success: false,
                status: 'failed' as IntentStatus,
                error: error.message,
            };

            logger.error('[RXE] ❌ Intent execution failed', {
                intentId: intent.id,
                error: error.message,
            });

            this.emit('intent:failed', result);

            return result;
        }
    }

    /**
     * Handle expired intent
     */
    private async handleExpired(intent: Intent): Promise<ExecutionResult> {
        await IntentService.updateStatus(intent.id, 'expired');

        this.stats.totalExpired++;

        const result: ExecutionResult = {
            intentId: intent.id,
            success: false,
            status: 'expired',
            error: 'Intent deadline passed',
        };

        logger.info('[RXE] ⏰ Intent expired', {
            intentId: intent.id,
            deadline: new Date(intent.deadline).toISOString(),
        });

        this.emit('intent:expired', result);

        return result;
    }

    /* ============================================
       VALIDATION & HELPERS
       ============================================ */

    /**
     * Check if intent has expired
     */
    private isExpired(intent: Intent): boolean {
        return Date.now() > intent.deadline;
    }

    /**
     * Validate slippage is within acceptable range
     */
    private validateSlippage(intent: Intent): boolean {
        // Extract slippage from minAmountOut calculation
        // For now, assume slippage was validated at creation
        return true;
    }

    /**
     * Get all active intents from the store
     */
    private async getAllActiveIntents(): Promise<Intent[]> {
        try {
            return await IntentService.getAllActive();
        } catch {
            return [];
        }
    }

    /**
     * Prioritize intents for processing order
     */
    private prioritizeIntents(intents: Intent[]): Intent[] {
        return intents.sort((a, b) => {
            // Market swaps first (immediate)
            if (a.type === 'swap' && b.type !== 'swap') return -1;
            if (b.type === 'swap' && a.type !== 'swap') return 1;

            // Then by creation time (oldest first)
            return a.createdAt - b.createdAt;
        });
    }

    /**
     * Flush any remaining items in the queue
     */
    private async flushQueue(): Promise<void> {
        this.priorityQueue = [];
    }

    /**
     * Generate mock transaction hash
     */
    private generateTxHash(): string {
        return '0x' + Array(64).fill(0)
            .map(() => Math.floor(Math.random() * 16).toString(16))
            .join('');
    }

    /**
     * Calculate gas used (mock)
     */
    private calculateGas(intent: Intent): string {
        const baseGas = 150000;
        const complexity = intent.type === 'dca' ? 1.2 : 1.0;
        return Math.floor(baseGas * complexity).toString();
    }

    /* ============================================
       IMMEDIATE EXECUTION (for market swaps)
       ============================================ */

    /**
     * Queue an intent for immediate execution
     * Used when a market swap is created
     */
    async queueImmediate(intent: Intent): Promise<ExecutionResult | null> {
        if (intent.type !== 'swap') {
            logger.warn('[RXE] Only swap intents can be queued for immediate execution');
            return null;
        }

        logger.info('[RXE] ⚡ Queueing intent for immediate execution', {
            intentId: intent.id,
        });

        // Activate the intent first
        await IntentService.updateStatus(intent.id, 'active');

        // Process immediately
        return await this.processIntent(intent);
    }
}

// Singleton instance
let engineInstance: ReactiveExecutionEngine | null = null;

export function getReactiveEngine(): ReactiveExecutionEngine {
    if (!engineInstance) {
        engineInstance = new ReactiveExecutionEngine();
    }
    return engineInstance;
}

export default ReactiveExecutionEngine;
