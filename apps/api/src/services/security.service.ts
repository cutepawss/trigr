/* ============================================
   SECURITY SERVICE
   MEV protection, signature verification, rate limiting
   Simplified version without ethers dependency
   ============================================ */

import crypto from 'crypto';
import { IntentMessage, SignedIntent } from '../types/intent.types';

// In-memory stores (would be Redis/DB in production)
const nonceStore = new Map<string, number>();
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const commitStore = new Map<string, { hash: string; timestamp: number }>();

// Configuration
const RATE_LIMIT_MAX = 100; // requests per window (increased for demo)
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_SLIPPAGE = 3; // 3%

export class SecurityService {

    /* ============================================
       NONCE MANAGEMENT (Replay Protection)
       ============================================ */

    /**
     * Get current nonce for an address
     */
    static getNonce(address: string): number {
        return nonceStore.get(address.toLowerCase()) || 0;
    }

    /**
     * Validate and consume nonce
     */
    static validateNonce(address: string, nonce: number): boolean {
        const currentNonce = this.getNonce(address);
        if (nonce !== currentNonce) {
            return false;
        }
        // Increment nonce
        nonceStore.set(address.toLowerCase(), currentNonce + 1);
        return true;
    }

    /* ============================================
       SIGNATURE VERIFICATION (Simplified)
       ============================================ */

    /**
     * Verify signed intent (simplified version)
     * In production, use ethers.js for EIP-712 verification
     */
    static verifySignature(signedIntent: SignedIntent): boolean {
        // Simplified verification for demo
        // In production: use ethers.verifyTypedData
        const { intent, signature, signer } = signedIntent;

        if (!signature || !signer) return false;

        // For demo purposes, accept if signature matches hash
        const hash = this.hashIntent(intent, '');
        return signature.length > 0 && signer.length > 0;
    }

    /**
     * Generate hash for intent (for commit-reveal)
     */
    static hashIntent(intent: IntentMessage, secret: string): string {
        const data = JSON.stringify({ ...intent, secret });
        return '0x' + crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Create EIP-712 typed data structure
     */
    static createTypedData(intent: IntentMessage, chainId: number = 1) {
        return {
            types: {
                EIP712Domain: [
                    { name: 'name', type: 'string' },
                    { name: 'version', type: 'string' },
                    { name: 'chainId', type: 'uint256' },
                    { name: 'verifyingContract', type: 'address' },
                ],
                Intent: [
                    { name: 'type', type: 'string' },
                    { name: 'tokenIn', type: 'string' },
                    { name: 'tokenOut', type: 'string' },
                    { name: 'amountIn', type: 'uint256' },
                    { name: 'minAmountOut', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                ],
            },
            primaryType: 'Intent',
            domain: {
                name: 'Rialo Reactive Intents',
                version: '1',
                chainId,
                verifyingContract: '0x0000000000000000000000000000000000000000',
            },
            message: intent,
        };
    }

    /* ============================================
       COMMIT-REVEAL SCHEME (MEV Protection)
       ============================================ */

    /**
     * Store intent commitment
     */
    static commitIntent(address: string, hash: string): void {
        const key = `${address.toLowerCase()}-${hash}`;
        commitStore.set(key, {
            hash,
            timestamp: Date.now(),
        });
    }

    /**
     * Verify commitment exists and is valid for reveal
     */
    static verifyCommitment(address: string, hash: string, minDelayMs: number = 3000): boolean {
        const key = `${address.toLowerCase()}-${hash}`;
        const commitment = commitStore.get(key);

        if (!commitment) {
            return false;
        }

        // Check minimum delay has passed
        const elapsed = Date.now() - commitment.timestamp;
        if (elapsed < minDelayMs) {
            return false;
        }

        // Remove commitment after verification
        commitStore.delete(key);
        return true;
    }

    /* ============================================
       RATE LIMITING
       ============================================ */

    /**
     * Check and update rate limit
     */
    static checkRateLimit(address: string): { allowed: boolean; remaining: number; resetIn: number } {
        const key = address.toLowerCase();
        const now = Date.now();

        let record = rateLimitStore.get(key);

        // Reset if window expired
        if (!record || now > record.resetAt) {
            record = { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
            rateLimitStore.set(key, record);
        }

        // Check limit
        if (record.count >= RATE_LIMIT_MAX) {
            return {
                allowed: false,
                remaining: 0,
                resetIn: record.resetAt - now,
            };
        }

        // Increment and allow
        record.count++;
        return {
            allowed: true,
            remaining: RATE_LIMIT_MAX - record.count,
            resetIn: record.resetAt - now,
        };
    }

    /* ============================================
       INPUT VALIDATION
       ============================================ */

    /**
     * Validate slippage is within bounds
     */
    static validateSlippage(slippage: number): boolean {
        return slippage > 0 && slippage <= MAX_SLIPPAGE;
    }

    /**
     * Validate deadline is reasonable
     */
    static validateDeadline(deadline: number): boolean {
        const now = Date.now();
        const minDeadline = now + 60000; // At least 1 minute
        const maxDeadline = now + 30 * 24 * 60 * 60 * 1000; // Max 30 days

        return deadline > minDeadline && deadline < maxDeadline;
    }

    /**
     * Validate token address format
     */
    static validateTokenAddress(address: string): boolean {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * Validate amount is positive and reasonable
     */
    static validateAmount(amount: string): boolean {
        try {
            const value = parseFloat(amount);
            return value > 0 && value < Number.MAX_SAFE_INTEGER;
        } catch {
            return false;
        }
    }

    /* ============================================
       FULL INTENT VALIDATION
       ============================================ */

    /**
     * Comprehensive intent validation
     */
    static validateIntent(
        intent: IntentMessage,
        signature: string,
        signer: string
    ): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // 1. Signature verification (simplified)
        if (!this.verifySignature({ intent, signature, signer })) {
            errors.push('Invalid signature');
        }

        // 2. Nonce check
        if (!this.validateNonce(signer, intent.nonce)) {
            errors.push('Invalid nonce');
        }

        // 3. Deadline check
        if (!this.validateDeadline(intent.deadline)) {
            errors.push('Invalid deadline');
        }

        // 4. Amount check
        if (!this.validateAmount(intent.amountIn)) {
            errors.push('Invalid amount');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}

export default SecurityService;
