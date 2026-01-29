/* ============================================
   INTENT TYPES
   Core type definitions for RRI
   ============================================ */

export type IntentType = 'swap' | 'limit' | 'dca';
export type IntentStatus = 'pending' | 'active' | 'executed' | 'expired' | 'cancelled';

export interface Intent {
    id: string;
    userId: string;
    type: IntentType;
    status: IntentStatus;

    // Token configuration
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    minAmountOut: string;

    // Predicate conditions
    predicate: Predicate;

    // Security
    nonce: number;
    signature: string;
    commitHash?: string;
    revealed: boolean;

    // Timing
    deadline: number;
    createdAt: number;
    executedAt?: number;

    // Execution details
    txHash?: string;
    actualAmountOut?: string;
    gasUsed?: string;
}

export interface Predicate {
    type: 'price' | 'time' | 'balance' | 'custom';
    operator: 'gte' | 'lte' | 'eq' | 'interval';
    value: string;
    token?: string;
    oracleSource?: string;
}

export interface CreateIntentInput {
    type: IntentType;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    targetPrice?: string;
    slippage: string;     // percentage
    deadline: number;     // hours
    predicateOperator?: 'gte' | 'lte';  // For limit orders: lte = execute when price drops to target
    isStopLoss?: boolean; // If true, track tokenIn price instead of tokenOut
}

export interface IntentSimulation {
    intentId: string;
    estimatedOutput: string;
    estimatedGas: string;
    priceImpact: string;
    route: string[];
    willExecute: boolean;
    reason?: string;
}

export interface OraclePrice {
    token: string;
    price: string;
    timestamp: number;
    source: string;
    confidence: number;
}

/* ============================================
   SECURITY TYPES
   ============================================ */

export interface EIP712Domain {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
}

export interface IntentMessage {
    type: IntentType;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    minAmountOut: string;
    deadline: number;
    nonce: number;
}

export interface SignedIntent {
    intent: IntentMessage;
    signature: string;
    signer: string;
}
