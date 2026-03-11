/* ============================================
   INTENT SERVICE
   Core business logic for intent management
   ============================================ */

import { v4 as uuidv4 } from 'uuid';
import {
    Intent,
    IntentType,
    IntentStatus,
    CreateIntentInput,
    IntentSimulation,
    Predicate
} from '../types/intent.types';
import SecurityService from './security.service';
import OracleService from './oracle.service';

// In-memory intent store (would be DB in production)
const intentStore = new Map<string, Intent>();

export class IntentService {

    /* ============================================
       INTENT CRUD
       ============================================ */

    /**
     * Create a new intent
     */
    static async create(userId: string, input: CreateIntentInput): Promise<Intent> {
        const id = uuidv4();
        const now = Date.now();

        // Get current nonce for user
        const nonce = SecurityService.getNonce(userId);

        // Build predicate based on intent type
        let predicate = this.buildPredicate(input);

        // For limit orders, auto-detect operator based on target vs current price
        if (input.type === 'limit' && input.targetPrice && predicate.token) {
            const currentPriceData = await OracleService.getPrice(predicate.token);
            const currentPrice = parseFloat(currentPriceData.price);
            const targetPrice = parseFloat(input.targetPrice);

            // If target > current, user wants to execute when price RISES -> gte
            // If target < current, user wants to execute when price DROPS -> lte
            if (!input.isStopLoss) {
                predicate.operator = targetPrice > currentPrice ? 'gte' : 'lte';
            }
            // For stop-loss, always use 'lte' (execute when drops to or below)
        }

        // Calculate deadline
        const deadline = now + (input.deadline * 60 * 60 * 1000); // hours to ms

        // Calculate min output with slippage
        const price = await OracleService.getPrice(input.tokenOut);
        const inputAmount = parseFloat(input.amountIn);
        const outputAmount = inputAmount / parseFloat(price.price);
        const slippageFactor = 1 - (parseFloat(input.slippage) / 100);
        const minOutput = outputAmount * slippageFactor;

        const intent: Intent = {
            id,
            userId,
            type: input.type,
            status: 'pending',
            tokenIn: input.tokenIn,
            tokenOut: input.tokenOut,
            amountIn: input.amountIn,
            minAmountOut: minOutput.toFixed(8),
            predicate,
            nonce,
            signature: '', // Will be set when user signs
            revealed: false,
            deadline,
            createdAt: now,
        };

        intentStore.set(id, intent);

        return intent;
    }

    /**
     * Build predicate from input
     * For limit orders:
     * - Crypto-to-crypto: use ratio predicate (tokenIn/tokenOut ratio)
     * - Crypto-to-stablecoin or Stablecoin-to-crypto: use price predicate
     */
    private static buildPredicate(input: CreateIntentInput): Predicate {
        switch (input.type) {
            case 'limit':
                const STABLECOINS = ['USDC', 'USDT', 'DAI', 'BUSD'];
                const tokenInIsStable = STABLECOINS.includes(input.tokenIn);
                const tokenOutIsStable = STABLECOINS.includes(input.tokenOut);
                const isCryptoToCrypto = !tokenInIsStable && !tokenOutIsStable;

                // Crypto-to-crypto: use ratio predicate
                if (isCryptoToCrypto && input.targetRatio) {
                    const operator: 'gte' | 'lte' = input.predicateOperator || 'gte';
                    return {
                        type: 'ratio',
                        operator,
                        value: input.targetRatio,
                        tokenA: input.tokenIn,
                        tokenB: input.tokenOut,
                        oracleSource: 'aggregated',
                    };
                }

                // Stablecoin involved: use price predicate
                let predicateToken: string;
                if (!tokenInIsStable && tokenOutIsStable) {
                    predicateToken = input.tokenIn; // Selling crypto for stables
                } else if (tokenInIsStable && !tokenOutIsStable) {
                    predicateToken = input.tokenOut; // Buying crypto with stables
                } else {
                    predicateToken = input.tokenIn; // Default
                }

                let operator: 'gte' | 'lte';
                if (input.predicateOperator) {
                    operator = input.predicateOperator as 'gte' | 'lte';
                } else if (input.isStopLoss) {
                    operator = 'lte';
                } else if (!tokenInIsStable && tokenOutIsStable) {
                    operator = 'gte'; // Take-profit: execute when price rises
                } else {
                    operator = 'lte'; // Limit buy: execute when price drops
                }

                return {
                    type: 'price',
                    operator,
                    value: input.targetPrice || '0',
                    token: predicateToken,
                    oracleSource: 'aggregated',
                };

            case 'dca':
                return {
                    type: 'time',
                    operator: 'interval',
                    value: '86400000', // 1 day in ms
                };
            case 'swap':
            default:
                return {
                    type: 'price',
                    operator: 'lte',
                    value: '999999999', // Any price
                    token: input.tokenOut,
                    oracleSource: 'aggregated',
                };
        }
    }

    /**
     * Get intent by ID
     */
    static async getById(id: string): Promise<Intent | null> {
        return intentStore.get(id) || null;
    }

    /**
     * Get all intents for a user
     */
    static async getByUser(userId: string): Promise<Intent[]> {
        const intents: Intent[] = [];
        for (const intent of intentStore.values()) {
            if (intent.userId === userId) {
                intents.push(intent);
            }
        }
        return intents.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Get all active intents (for reactive engine)
     */
    static async getAllActive(): Promise<Intent[]> {
        const intents: Intent[] = [];
        for (const intent of intentStore.values()) {
            if (['pending', 'active'].includes(intent.status)) {
                intents.push(intent);
            }
        }
        return intents.sort((a, b) => a.createdAt - b.createdAt);
    }

    /**
     * Update intent status
     */
    static async updateStatus(id: string, status: IntentStatus): Promise<Intent | null> {
        const intent = intentStore.get(id);
        if (!intent) return null;

        intent.status = status;
        if (status === 'executed') {
            intent.executedAt = Date.now();
        }

        intentStore.set(id, intent);
        return intent;
    }

    /**
     * Cancel an intent
     */
    static async cancel(id: string, userId: string): Promise<Intent | null> {
        const intent = intentStore.get(id);
        if (!intent) return null;
        if (intent.userId !== userId) return null;
        if (intent.status === 'executed') return null;

        intent.status = 'cancelled';
        intentStore.set(id, intent);
        return intent;
    }

    /**
     * Delete an intent
     */
    static async delete(id: string, userId: string): Promise<boolean> {
        const intent = intentStore.get(id);
        if (!intent) return false;
        if (intent.userId !== userId) return false;

        intentStore.delete(id);
        return true;
    }

    /**
     * Update an intent's parameters (only pending/active)
     */
    static async updateIntent(id: string, updates: {
        targetPrice?: number;
        slippage?: number;
        amountIn?: string;
    }): Promise<Intent | null> {
        const intent = intentStore.get(id);
        if (!intent) return null;
        if (intent.status === 'executed' || intent.status === 'cancelled') return null;

        // Apply updates
        if (updates.targetPrice !== undefined && intent.predicate.type === 'price') {
            intent.predicate.value = updates.targetPrice.toString();
        }

        if (updates.amountIn !== undefined) {
            intent.amountIn = updates.amountIn;
        }

        // Recalculate minAmountOut if slippage or amount changed
        if (updates.slippage !== undefined || updates.amountIn !== undefined) {
            // Simple update - in production would recalculate with oracle
            const slippage = updates.slippage ?? 0.5;
            const amount = parseFloat(updates.amountIn ?? intent.amountIn);
            const slippageFactor = 1 - (slippage / 100);
            intent.minAmountOut = (amount * slippageFactor).toFixed(8);
        }

        intentStore.set(id, intent);
        return intent;
    }

    /* ============================================
       INTENT SIMULATION
       ============================================ */

    /**
     * Simulate intent execution
     */
    static async simulate(id: string): Promise<IntentSimulation> {
        const intent = await this.getById(id);
        if (!intent) {
            throw new Error('Intent not found');
        }

        // Get current prices
        const priceIn = await OracleService.getPrice(intent.tokenIn);
        const priceOut = await OracleService.getPrice(intent.tokenOut);

        // Calculate expected output
        const inputValue = parseFloat(intent.amountIn) * parseFloat(priceIn.price);
        const estimatedOutput = inputValue / parseFloat(priceOut.price);

        // Calculate price impact (mock)
        const priceImpact = (parseFloat(intent.amountIn) / 10000) * 0.001; // 0.1% per 10k units

        // Evaluate predicate
        const predicateSatisfied = await this.evaluatePredicate(intent);

        // Estimate gas
        const estimatedGas = '150000';

        return {
            intentId: id,
            estimatedOutput: estimatedOutput.toFixed(8),
            estimatedGas,
            priceImpact: (priceImpact * 100).toFixed(4) + '%',
            route: [intent.tokenIn, intent.tokenOut],
            willExecute: predicateSatisfied,
            reason: predicateSatisfied ? 'Predicate conditions met' : 'Waiting for conditions',
        };
    }

    /* ============================================
       PREDICATE EVALUATION
       ============================================ */

    /**
     * Evaluate if intent predicate is satisfied
     */
    static async evaluatePredicate(intent: Intent): Promise<boolean> {
        const { predicate } = intent;

        switch (predicate.type) {
            case 'price':
                const result = await OracleService.evaluatePricePredicate(
                    predicate.token || intent.tokenOut,
                    predicate.operator as 'gte' | 'lte' | 'eq',
                    predicate.value
                );
                return result.satisfied;

            case 'time':
                if (predicate.operator === 'interval') {
                    // Check if interval has passed since last execution
                    const interval = parseInt(predicate.value);
                    const lastExec = intent.executedAt || intent.createdAt;
                    return Date.now() - lastExec >= interval;
                }
                return true;

            case 'balance':
                // Would check on-chain balance
                return true;

            default:
                return false;
        }
    }

    /* ============================================
       REACTIVE EXECUTION (Rialo Integration Mock)
       ============================================ */

    /**
     * Check all active intents and execute if conditions met
     * This simulates what Rialo's reactive execution would do natively
     */
    static async checkAndExecuteIntents(): Promise<Intent[]> {
        const executedIntents: Intent[] = [];

        for (const intent of intentStore.values()) {
            // Skip non-active intents
            if (!['pending', 'active'].includes(intent.status)) continue;

            // Check deadline
            if (Date.now() > intent.deadline) {
                await this.updateStatus(intent.id, 'expired');
                continue;
            }

            // Evaluate predicate
            const satisfied = await this.evaluatePredicate(intent);

            if (satisfied) {
                // Execute the intent (mock)
                await this.executeIntent(intent);
                executedIntents.push(intent);
            }
        }

        return executedIntents;
    }

    /**
     * Execute an intent (mock Rialo transaction)
     */
    private static async executeIntent(intent: Intent): Promise<void> {
        // In real Rialo, this would be a reactive transaction
        // Here we just simulate the execution

        const priceOut = await OracleService.getPrice(intent.tokenOut);
        const inputValue = parseFloat(intent.amountIn);
        const actualOutput = inputValue / parseFloat(priceOut.price);

        intent.status = 'executed';
        intent.executedAt = Date.now();
        intent.actualAmountOut = actualOutput.toFixed(8);
        intent.gasUsed = '145000';
        intent.txHash = '0x' + Array(64).fill(0).map(() =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');

        intentStore.set(intent.id, intent);

        console.log(`[RRI] Intent ${intent.id} executed: ${intent.amountIn} ${intent.tokenIn} → ${intent.actualAmountOut} ${intent.tokenOut}`);
    }

    /* ============================================
       STATISTICS
       ============================================ */

    /**
     * Get intent statistics for a user
     */
    static async getStats(userId: string): Promise<{
        total: number;
        active: number;
        executed: number;
        successRate: string;
    }> {
        const intents = await this.getByUser(userId);

        const active = intents.filter(i => ['pending', 'active'].includes(i.status)).length;
        const executed = intents.filter(i => i.status === 'executed').length;
        const failed = intents.filter(i => ['expired', 'cancelled'].includes(i.status)).length;

        const successRate = intents.length > 0
            ? ((executed / (executed + failed)) * 100).toFixed(1)
            : '100';

        return {
            total: intents.length,
            active,
            executed,
            successRate: successRate + '%',
        };
    }
}

export default IntentService;
