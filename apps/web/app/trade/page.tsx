'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

/* ============================================
   TRIGR - TRADING TERMINAL
   Real API integration with Rialo backend
   ============================================ */

const API_BASE = 'http://localhost:3001/api';

// Token configuration - BTC, ETH, SOL, ADA, MATIC as per Rialo demo
const TOKEN_CONFIG: Record<string, { name: string; color: string; icon: string }> = {
    BTC: { name: 'Bitcoin', color: '#f7931a', icon: '₿' },
    ETH: { name: 'Ethereum', color: '#627eea', icon: 'Ξ' },
    SOL: { name: 'Solana', color: '#9945ff', icon: '◎' },
    ADA: { name: 'Cardano', color: '#0033ad', icon: '₳' },
    MATIC: { name: 'Polygon', color: '#8247e5', icon: '⬡' },
    USDC: { name: 'USD Coin', color: '#2775ca', icon: '$' },
};

type TokenKey = keyof typeof TOKEN_CONFIG;
type OrderType = 'market' | 'limit' | 'dca' | 'stop';

interface TokenPrice {
    symbol: string;
    price: number;
    change: number;
    isLoading: boolean;
}

interface Intent {
    id: string;
    type: string;
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    targetPrice?: string;
    status: string;
    predicate: { type: string; humanReadable: string };
    createdAt: string;
}

export default function TradePage() {
    const [mounted, setMounted] = useState(false);
    const [orderType, setOrderType] = useState<OrderType>('market');
    const [tokenIn, setTokenIn] = useState<TokenKey>('USDC');
    const [tokenOut, setTokenOut] = useState<TokenKey>('ETH');
    const [amountIn, setAmountIn] = useState('');
    const [targetPrice, setTargetPrice] = useState('');
    const [slippage, setSlippage] = useState('0.5');
    const [frequency, setFrequency] = useState<'hourly' | 'daily' | 'weekly'>('daily');
    const [executions, setExecutions] = useState('10');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Real data states
    const [prices, setPrices] = useState<Record<string, TokenPrice>>({});
    const [intents, setIntents] = useState<Intent[]>([]);
    const [pricesLoading, setPricesLoading] = useState(true);
    const [intentsLoading, setIntentsLoading] = useState(true);

    // Mock wallet balances for demo
    const [balances] = useState<Record<string, number>>({
        USDC: 10000.00,
        USDT: 5000.00,
        DAI: 2500.00,
        ETH: 2.5,
        BTC: 0.15,
        SOL: 50.0,
        ADA: 5000.0,
        MATIC: 10000.0,
    });

    useEffect(() => { setMounted(true); }, []);

    // Generate simulated price history for chart
    const [priceHistory, setPriceHistory] = useState<Record<string, number[]>>({});


    // Fetch prices from Oracle Service
    const fetchPrices = useCallback(async () => {
        const tokens = Object.keys(TOKEN_CONFIG);
        const newPrices: Record<string, TokenPrice> = {};

        for (const token of tokens) {
            try {
                const res = await fetch(`${API_BASE}/intents/prices/${token}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        const price = parseFloat(data.data.price.price);
                        // Deterministic change based on token (simulated 24h change)
                        const isStablecoin = ['USDC', 'USDT', 'DAI'].includes(token);
                        const simulatedChange = isStablecoin ? 0 : ((price * 7) % 10 - 5) * 0.5; // -2.5% to +2.5%

                        newPrices[token] = {
                            symbol: token,
                            price,
                            change: prices[token]?.change ?? simulatedChange, // Keep previous or use simulated
                            isLoading: false,
                        };
                    }
                }
            } catch (err) {
                console.error(`Failed to fetch price for ${token}:`, err);
                newPrices[token] = {
                    symbol: token,
                    price: 0,
                    change: 0,
                    isLoading: false,
                };
            }
        }

        setPrices(newPrices);
        setPricesLoading(false);

        // Update price history for chart - add current price point, don't regenerate
        setPriceHistory(prev => {
            const updated: Record<string, number[]> = { ...prev };
            Object.entries(newPrices).forEach(([token, data]) => {
                if (data.price > 0) {
                    const existing = updated[token] || [];
                    if (existing.length === 0) {
                        // First load - create initial history with slight sine wave variation
                        const history: number[] = [];
                        for (let i = 0; i < 24; i++) {
                            const variation = Math.sin(i * 0.5) * 0.015 * data.price;
                            history.push(data.price + variation);
                        }
                        history.push(data.price);
                        updated[token] = history;
                    } else {
                        // Already have history - append current price and trim old
                        const newHistory = [...existing.slice(-24), data.price];
                        updated[token] = newHistory;
                    }
                }
            });
            return updated;
        });
    }, []);

    // Fetch intents from Intent Service
    const fetchIntents = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/intents`, {
                headers: { 'x-user-id': 'demo-user' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setIntents(data.data.intents || []);
                }
            }
        } catch (err) {
            console.error('Failed to fetch intents:', err);
        }
        setIntentsLoading(false);
    }, []);

    // Initial fetch and polling
    useEffect(() => {
        if (mounted) {
            fetchPrices();
            fetchIntents();

            // Poll prices every 10 seconds
            const priceInterval = setInterval(fetchPrices, 10000);

            // Poll intents every 3 seconds for real-time status updates
            const intentInterval = setInterval(fetchIntents, 3000);

            return () => {
                clearInterval(priceInterval);
                clearInterval(intentInterval);
            };
        }
    }, [mounted, fetchPrices, fetchIntents]);

    const priceIn = prices[tokenIn]?.price || 0;
    const priceOut = prices[tokenOut]?.price || 0;

    // Stablecoins - we don't want to chart these (boring flat lines)
    const stablecoins = ['USDC', 'USDT', 'DAI', 'BUSD'];

    // Always show the "interesting" (non-stablecoin) asset in the chart
    // If tokenIn is stablecoin (buying crypto with stables), show tokenOut
    // If tokenOut is stablecoin (selling crypto for stables), show tokenIn
    // If neither/both are stablecoins, prefer tokenIn
    const getChartToken = () => {
        const tokenInIsStable = stablecoins.includes(tokenIn);
        const tokenOutIsStable = stablecoins.includes(tokenOut);

        if (tokenInIsStable && !tokenOutIsStable) return tokenOut; // Buying crypto with stables
        if (!tokenInIsStable && tokenOutIsStable) return tokenIn;  // Selling crypto for stables
        return tokenIn; // Default to tokenIn
    };

    const chartToken = getChartToken();
    const trackedToken = chartToken; // Same logic for price tracking
    const trackedPrice = prices[trackedToken]?.price || 0;
    const estimatedOut = amountIn && priceIn > 0 && priceOut > 0
        ? ((parseFloat(amountIn) * priceIn) / priceOut).toFixed(6)
        : '0';

    const getPredicate = () => {
        switch (orderType) {
            case 'market': return 'Execute immediately';
            case 'limit': return `price(${trackedToken}) ≤ $${targetPrice || '0'}`;
            case 'dca': return `every ${frequency === 'hourly' ? '1h' : frequency === 'daily' ? '24h' : '7d'}`;
            case 'stop': return `price(${trackedToken}) ≤ $${targetPrice || '0'}`;
        }
    };

    // Create intent via API
    const handleSubmit = async () => {
        if (!amountIn) return;
        setLoading(true);
        setError(null);

        try {
            // For limit orders: use 'lte' so it executes when price DROPS to target
            // This is correct for buy limits (buy when cheaper) and stop-loss (sell when price falls)
            // isStopLoss tells backend to track tokenIn price (the asset being sold)
            const intentData = {
                type: orderType === 'stop' ? 'limit' : orderType, // API treats stop as limit with lte
                tokenIn,
                tokenOut,
                amountIn,
                targetPrice: targetPrice || undefined,
                slippage,
                deadline: 24,
                predicateOperator: (orderType === 'limit' || orderType === 'stop') ? 'lte' : undefined,
                isStopLoss: orderType === 'stop', // Backend uses this to determine which token's price to track
                frequency: orderType === 'dca' ? frequency : undefined,
                executions: orderType === 'dca' ? parseInt(executions) : undefined,
            };

            const res = await fetch(`${API_BASE}/intents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': 'demo-user',
                },
                body: JSON.stringify(intentData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error?.message || 'Failed to create intent');
            }

            const data = await res.json();
            if (data.success) {
                // Refresh intents list
                await fetchIntents();
                setAmountIn('');
                setTargetPrice('');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Cancel intent via API
    const handleCancelIntent = async (intentId: string) => {
        try {
            const res = await fetch(`${API_BASE}/intents/${intentId}`, {
                method: 'DELETE',
                headers: { 'x-user-id': 'demo-user' },
            });

            if (res.ok) {
                await fetchIntents();
            }
        } catch (err) {
            console.error('Failed to cancel intent:', err);
        }
    };

    const fmt = (n: number) => {
        if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        if (n >= 1) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
    };

    const green = '#10b981';
    const red = '#ef4444';
    const bg = '#f1f0ea';
    const card = '#ffffff';
    const accent = '#2d232e';
    const accentLight = '#534b52';
    const text = '#474448';
    const muted = '#8a8687';
    const border = '#e0ddcf';

    if (!mounted) return null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: bg, color: text, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Header */}
            <header style={{ borderBottom: `1px solid ${border}`, padding: '12px 24px', backgroundColor: card }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent} 0%, ${accentLight} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>T</div>
                        <span style={{ fontWeight: 700, fontSize: '20px', color: accent }}>Trigr</span>
                    </Link>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: pricesLoading ? '#fbbf24' : green, animation: pricesLoading ? 'pulse 1s infinite' : 'none' }} />
                            <span style={{ fontSize: '12px', color: muted }}>
                                {pricesLoading ? 'Connecting to Oracle...' : 'Live Prices'}
                            </span>
                        </div>
                        <span style={{ fontSize: '13px', color: muted }}>Powered by Rialo</span>
                        <div style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: bg, fontSize: '13px', fontWeight: 500, color: text, border: `1px solid ${border}` }}>
                            demo-user
                        </div>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px', display: 'grid', gridTemplateColumns: '400px 1fr 340px', gap: '20px' }}>

                {/* Left: Order Form */}
                <div style={{ backgroundColor: card, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
                    {/* Order Type Tabs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '24px', backgroundColor: bg, padding: '6px', borderRadius: '12px' }}>
                        {(['market', 'limit', 'dca', 'stop'] as OrderType[]).map(t => (
                            <button key={t} onClick={() => setOrderType(t)} style={{
                                padding: '12px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                fontSize: '13px', fontWeight: 600, textTransform: 'capitalize',
                                backgroundColor: orderType === t ? card : 'transparent',
                                color: orderType === t ? accent : muted,
                                boxShadow: orderType === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s',
                            }}>{t === 'dca' ? 'DCA' : t}</button>
                        ))}
                    </div>

                    {/* Error display */}
                    {error && (
                        <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', marginBottom: '16px', color: red, fontSize: '13px' }}>
                            {error}
                        </div>
                    )}

                    {/* Token Selectors */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ fontSize: '12px', color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                            {orderType === 'stop' ? 'Sell' : 'From'}
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: bg, padding: '14px', borderRadius: '12px', border: `1px solid ${border}` }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: TOKEN_CONFIG[tokenIn]?.color || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600 }}>{TOKEN_CONFIG[tokenIn]?.icon}</div>
                            <select value={tokenIn} onChange={e => setTokenIn(e.target.value as TokenKey)} style={{
                                backgroundColor: 'transparent', border: 'none', color: text, fontSize: '16px', fontWeight: 600, cursor: 'pointer', outline: 'none', flex: 1,
                            }}>
                                {Object.keys(TOKEN_CONFIG).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input type="number" placeholder="0.00" value={amountIn} onChange={e => setAmountIn(e.target.value)} style={{
                                width: '120px', backgroundColor: 'transparent', border: 'none', color: text, fontSize: '20px', fontWeight: 600, textAlign: 'right', outline: 'none', fontFamily: 'monospace',
                            }} />
                        </div>
                        {prices[tokenIn] && (
                            <div style={{ fontSize: '12px', color: muted, marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Balance: <strong style={{ color: text }}>{balances[tokenIn]?.toLocaleString() || 0} {tokenIn}</strong></span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <span>≈ ${fmt(prices[tokenIn].price)}</span>
                                    <button onClick={() => setAmountIn(balances[tokenIn]?.toString() || '0')} style={{
                                        backgroundColor: accent + '20', color: accent, border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase',
                                    }}>Max</button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted, fontSize: '18px', border: `1px solid ${border}` }}>↓</div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '12px', color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                            {orderType === 'stop' ? 'Receive' : 'To'}
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: bg, padding: '14px', borderRadius: '12px', border: `1px solid ${border}` }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: TOKEN_CONFIG[tokenOut]?.color || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600 }}>{TOKEN_CONFIG[tokenOut]?.icon}</div>
                            <select value={tokenOut} onChange={e => setTokenOut(e.target.value as TokenKey)} style={{
                                backgroundColor: 'transparent', border: 'none', color: text, fontSize: '16px', fontWeight: 600, cursor: 'pointer', outline: 'none', flex: 1,
                            }}>
                                {Object.keys(TOKEN_CONFIG).filter(t => t !== tokenIn).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div style={{ width: '120px', textAlign: 'right', fontSize: '20px', fontWeight: 600, color: muted, fontFamily: 'monospace' }}>≈ {estimatedOut}</div>
                        </div>
                    </div>

                    {/* Conditional Inputs */}
                    {(orderType === 'limit' || orderType === 'stop') && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '12px', color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                                {orderType === 'limit' ? 'Target Price' : 'Stop Price'}
                            </label>
                            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: bg, padding: '14px', borderRadius: '12px', border: `1px solid ${border}` }}>
                                <span style={{ color: muted, marginRight: '8px', fontSize: '18px' }}>$</span>
                                <input type="number" placeholder={trackedPrice > 0 ? fmt(trackedPrice) : '0.00'} value={targetPrice} onChange={e => setTargetPrice(e.target.value)} style={{
                                    flex: 1, backgroundColor: 'transparent', border: 'none', color: text, fontSize: '20px', fontWeight: 600, outline: 'none', fontFamily: 'monospace',
                                }} />
                            </div>
                            <div style={{ fontSize: '12px', color: muted, marginTop: '6px' }}>
                                Current {trackedToken}: ${trackedPrice > 0 ? fmt(trackedPrice) : 'Loading...'}
                            </div>
                        </div>
                    )}

                    {orderType === 'dca' && (
                        <>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '12px', color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Frequency</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                    {(['hourly', 'daily', 'weekly'] as const).map(f => (
                                        <button key={f} onClick={() => setFrequency(f)} style={{
                                            padding: '12px', borderRadius: '10px', border: `1px solid ${frequency === f ? accent : border}`, cursor: 'pointer', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize',
                                            backgroundColor: frequency === f ? accent : 'transparent', color: frequency === f ? '#fff' : text, transition: 'all 0.2s',
                                        }}>{f}</button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '12px', color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Total Executions</label>
                                <input type="number" value={executions} onChange={e => setExecutions(e.target.value)} style={{
                                    width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: bg, border: `1px solid ${border}`, color: text, fontSize: '16px', fontWeight: 600, outline: 'none',
                                }} />
                            </div>
                        </>
                    )}

                    {orderType === 'market' && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '12px', color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px', fontWeight: 500 }}>Slippage Tolerance</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['0.5', '1', '2'].map(s => (
                                    <button key={s} onClick={() => setSlippage(s)} style={{
                                        flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${slippage === s ? accent : border}`, cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                        backgroundColor: slippage === s ? accent : 'transparent', color: slippage === s ? '#fff' : text, transition: 'all 0.2s',
                                    }}>{s}%</button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Predicate Preview */}
                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: `${accent}08`, marginBottom: '20px', border: `1px dashed ${accent}40` }}>
                        <div style={{ fontSize: '11px', color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 500 }}>Reactive Predicate (Rialo)</div>
                        <code style={{ fontSize: '15px', color: accent, fontFamily: 'monospace', fontWeight: 600 }}>{getPredicate()}</code>
                    </div>

                    {/* Submit Button */}
                    <button onClick={handleSubmit} disabled={!amountIn || loading || pricesLoading} style={{
                        width: '100%', padding: '18px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                        fontSize: '16px', fontWeight: 700, background: `linear-gradient(135deg, ${accent} 0%, ${accentLight} 100%)`, color: '#fff',
                        opacity: (!amountIn || loading || pricesLoading) ? 0.5 : 1, transition: 'all 0.2s',
                        boxShadow: '0 4px 12px rgba(45,35,46,0.3)',
                    }}>
                        {loading ? 'Submitting to Rialo...' : orderType === 'market' ? 'Execute Swap' : orderType === 'stop' ? 'Create Stop Loss' : 'Create Order'}
                    </button>
                </div>

                {/* Center: Market Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Price Display */}
                    <div style={{ backgroundColor: card, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: TOKEN_CONFIG[chartToken]?.color || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', fontWeight: 700 }}>{TOKEN_CONFIG[chartToken]?.icon}</div>
                                <div>
                                    <div style={{ fontSize: '20px', fontWeight: 700, color: text }}>{chartToken}/USDC</div>
                                    <div style={{ fontSize: '14px', color: muted }}>{TOKEN_CONFIG[chartToken]?.name}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                {pricesLoading ? (
                                    <div style={{ fontSize: '20px', color: muted }}>Loading...</div>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'monospace', color: text }}>
                                            ${prices[chartToken] ? fmt(prices[chartToken].price) : '0.00'}
                                        </div>
                                        <div style={{ fontSize: '15px', color: (prices[chartToken]?.change || 0) >= 0 ? green : red, fontWeight: 600 }}>
                                            {(prices[chartToken]?.change || 0) >= 0 ? '↑' : '↓'} {Math.abs(prices[chartToken]?.change || 0).toFixed(2)}%
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div style={{ height: '180px', backgroundColor: bg, borderRadius: '12px', overflow: 'hidden', border: `1px solid ${border}`, position: 'relative' }}>
                            {priceHistory[chartToken] && priceHistory[chartToken].length > 0 ? (
                                <svg width="100%" height="100%" viewBox="0 0 500 160" preserveAspectRatio="none">
                                    {/* Grid lines */}
                                    <defs>
                                        <linearGradient id={`gradient-${chartToken}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={TOKEN_CONFIG[chartToken]?.color || accent} stopOpacity="0.3" />
                                            <stop offset="100%" stopColor={TOKEN_CONFIG[chartToken]?.color || accent} stopOpacity="0.05" />
                                        </linearGradient>
                                    </defs>
                                    {[0.25, 0.5, 0.75].map(y => (
                                        <line key={y} x1="0" y1={160 * y} x2="500" y2={160 * y} stroke={border} strokeWidth="1" strokeDasharray="4,4" />
                                    ))}
                                    {/* Area fill */}
                                    <path
                                        d={(() => {
                                            const history = priceHistory[chartToken];
                                            const min = Math.min(...history) * 0.998;
                                            const max = Math.max(...history) * 1.002;
                                            const range = max - min || 1;
                                            const points = history.map((p, i) => {
                                                const x = (i / (history.length - 1)) * 500;
                                                const y = 150 - ((p - min) / range) * 140;
                                                return `${x},${y}`;
                                            });
                                            return `M0,160 L${points.join(' L')} L500,160 Z`;
                                        })()}
                                        fill={`url(#gradient-${chartToken})`}
                                    />
                                    {/* Line */}
                                    <path
                                        d={(() => {
                                            const history = priceHistory[chartToken];
                                            const min = Math.min(...history) * 0.998;
                                            const max = Math.max(...history) * 1.002;
                                            const range = max - min || 1;
                                            const points = history.map((p, i) => {
                                                const x = (i / (history.length - 1)) * 500;
                                                const y = 150 - ((p - min) / range) * 140;
                                                return `${x},${y}`;
                                            });
                                            return `M${points.join(' L')}`;
                                        })()}
                                        fill="none"
                                        stroke={TOKEN_CONFIG[chartToken]?.color || accent}
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    {/* Current price dot */}
                                    <circle
                                        cx="500"
                                        cy={(() => {
                                            const history = priceHistory[chartToken];
                                            const min = Math.min(...history) * 0.998;
                                            const max = Math.max(...history) * 1.002;
                                            const range = max - min || 1;
                                            return 150 - ((history[history.length - 1] - min) / range) * 140;
                                        })()}
                                        r="4"
                                        fill={TOKEN_CONFIG[chartToken]?.color || accent}
                                    />
                                </svg>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: muted, fontSize: '14px' }}>
                                    {pricesLoading ? 'Loading chart data...' : 'No price data available'}
                                </div>
                            )}
                            {/* Price labels */}
                            {priceHistory[chartToken] && (
                                <div style={{ position: 'absolute', right: '12px', top: '8px', fontSize: '11px', color: muted, backgroundColor: `${bg}cc`, padding: '4px 8px', borderRadius: '4px' }}>
                                    24h
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Markets */}
                    <div style={{ backgroundColor: card, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '14px', color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>Markets</h3>
                            <span style={{ fontSize: '11px', color: muted }}>via Oracle Service</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {Object.entries(TOKEN_CONFIG).filter(([s]) => s !== 'USDC').map(([symbol, config]) => (
                                <div key={symbol} onClick={() => setTokenOut(symbol as TokenKey)} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px',
                                    backgroundColor: tokenOut === symbol ? `${config.color}10` : bg,
                                    borderRadius: '12px', cursor: 'pointer',
                                    border: tokenOut === symbol ? `1px solid ${config.color}40` : `1px solid transparent`,
                                    transition: 'all 0.2s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: config.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600 }}>{config.icon}</div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: text }}>{symbol}</div>
                                            <div style={{ fontSize: '12px', color: muted }}>{config.name}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {pricesLoading ? (
                                            <div style={{ color: muted, fontSize: '12px' }}>...</div>
                                        ) : (
                                            <>
                                                <div style={{ fontWeight: 600, fontFamily: 'monospace', color: text }}>
                                                    ${prices[symbol] ? fmt(prices[symbol].price) : '0.00'}
                                                </div>
                                                <div style={{ fontSize: '12px', color: (prices[symbol]?.change || 0) >= 0 ? green : red, fontWeight: 500 }}>
                                                    {(prices[symbol]?.change || 0) >= 0 ? '+' : ''}{(prices[symbol]?.change || 0).toFixed(2)}%
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Active Intents */}
                <div style={{ backgroundColor: card, borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: `1px solid ${border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '14px', color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>Active Intents</h3>
                        <button onClick={fetchIntents} style={{ fontSize: '11px', color: accent, background: 'none', border: 'none', cursor: 'pointer' }}>↻ Refresh</button>
                    </div>

                    {intentsLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: muted }}>
                            <div>Loading intents...</div>
                        </div>
                    ) : intents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: muted }}>
                            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📭</div>
                            <div>No active intents</div>
                            <div style={{ fontSize: '12px', marginTop: '8px' }}>Create your first reactive order above</div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {intents.map(intent => (
                                <div key={intent.id} style={{ padding: '16px', backgroundColor: bg, borderRadius: '12px', border: `1px solid ${border}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: accentLight, letterSpacing: '0.5px' }}>{intent.type}</span>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', backgroundColor: intent.status === 'executed' ? green : intent.status === 'cancelled' ? red : accent, color: '#fff', fontWeight: 600 }}>{intent.status}</span>
                                            {(intent.status === 'pending' || intent.status === 'active') && (
                                                <button onClick={() => handleCancelIntent(intent.id)} style={{ fontSize: '10px', color: red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>✕ Cancel</button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 600, marginBottom: '6px', color: text, fontSize: '15px' }}>{intent.amountIn} {intent.tokenIn} → {intent.tokenOut}</div>
                                    <div style={{ fontSize: '12px', color: accent, fontFamily: 'monospace', fontWeight: 500, backgroundColor: `${accent}08`, padding: '6px 10px', borderRadius: '6px', display: 'inline-block' }}>
                                        {intent.predicate?.humanReadable || 'Execute immediately'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
