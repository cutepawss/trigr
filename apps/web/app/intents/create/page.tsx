'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ============================================
   INTENT CREATION WIZARD - LIGHT THEME
   Palette: #474448, #2d232e, #e0ddcf, #534b52, #f1f0ea
   ============================================ */

const C = {
    gray: '#474448',
    purple: '#2d232e',
    cream: '#e0ddcf',
    liver: '#534b52',
    alabaster: '#f1f0ea',
};

const tokens = [
    { symbol: 'ETH', icon: '⟠', balance: '2.5' },
    { symbol: 'USDC', icon: '💵', balance: '5000' },
    { symbol: 'BTC', icon: '₿', balance: '0.1' },
    { symbol: 'RIALO', icon: 'R', balance: '10000' },
];

const intentTypes = [
    { id: 'swap', title: 'Market Swap', desc: 'Swap tokens when conditions are met', icon: '⇄' },
    { id: 'limit', title: 'Limit Order', desc: 'Execute at a specific price target', icon: '📊' },
    { id: 'dca', title: 'DCA', desc: 'Recurring purchases on schedule', icon: '📅' },
];

export default function CreateIntentPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [intent, setIntent] = useState({ type: '', tokenIn: '', tokenOut: '', amountIn: '', targetPrice: '', slippage: '2', deadline: '24' });

    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    const update = (field: string, value: string) => setIntent(prev => ({ ...prev, [field]: value }));
    const canProceed = () => {
        if (step === 1) return intent.type !== '';
        if (step === 2) return intent.tokenIn && intent.tokenOut && intent.tokenIn !== intent.tokenOut;
        if (step === 3) return intent.amountIn && parseFloat(intent.amountIn) > 0;
        return true;
    };
    const submit = async () => { setLoading(true); await new Promise(r => setTimeout(r, 1500)); router.push('/intents'); };
    const predicate = () => intent.type === 'limit' ? `price(${intent.tokenOut || 'TOKEN'}) >= ${intent.targetPrice || '0'}` : intent.type === 'dca' ? 'interval(1 day)' : `market(${intent.tokenOut || 'TOKEN'})`;

    const stepStyle = (n: number): React.CSSProperties => ({
        width: '44px', height: '44px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px',
        backgroundColor: step >= n ? C.purple : C.cream, color: step >= n ? C.alabaster : C.liver,
    });

    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.alabaster, color: C.gray }}>
            {/* Nav */}
            <nav style={{ backgroundColor: `${C.alabaster}f5`, borderBottom: `1px solid ${C.cream}` }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: C.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.alabaster, fontWeight: 'bold', fontSize: '18px' }}>R</div>
                        <span style={{ color: C.purple, fontWeight: 700, fontSize: '20px' }}>RRI</span>
                    </Link>
                    <Link href="/intents" style={{ fontSize: '15px', color: C.liver, fontWeight: 500 }}>← Back to Dashboard</Link>
                </div>
            </nav>

            <main style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px' }}>
                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '48px' }}>
                    {['Type', 'Tokens', 'Amount', 'Review'].map((label, i) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={stepStyle(i + 1)}>{step > i + 1 ? '✓' : i + 1}</div>
                            <span style={{ marginLeft: '8px', fontSize: '14px', fontWeight: 600, color: step >= i + 1 ? C.purple : C.liver }}>{label}</span>
                            {i < 3 && <div style={{ width: '40px', height: '3px', margin: '0 16px', backgroundColor: step > i + 1 ? C.purple : C.cream, borderRadius: '2px' }} />}
                        </div>
                    ))}
                </div>

                {/* Card */}
                <div style={{ backgroundColor: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: `1px solid ${C.cream}` }}>

                    {/* Step 1: Type */}
                    {step === 1 && (
                        <div>
                            <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', color: C.purple }}>Choose Intent Type</h2>
                            <p style={{ color: C.liver, marginBottom: '28px' }}>What kind of automated transaction?</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {intentTypes.map(t => (
                                    <button key={t.id} onClick={() => update('type', t.id)} style={{
                                        padding: '24px', borderRadius: '16px', border: `2px solid ${intent.type === t.id ? C.purple : C.cream}`,
                                        cursor: 'pointer', backgroundColor: intent.type === t.id ? `${C.purple}08` : '#fff',
                                        display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left',
                                    }}>
                                        <span style={{ fontSize: '32px' }}>{t.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, color: C.purple, fontSize: '17px' }}>{t.title}</div>
                                            <div style={{ fontSize: '14px', color: C.liver, marginTop: '4px' }}>{t.desc}</div>
                                        </div>
                                        {intent.type === t.id && <span style={{ color: C.purple, fontSize: '24px' }}>✓</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Tokens */}
                    {step === 2 && (
                        <div>
                            <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', color: C.purple }}>Select Tokens</h2>
                            <p style={{ color: C.liver, marginBottom: '28px' }}>Choose tokens for your swap</p>

                            <div style={{ fontSize: '12px', color: C.liver, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', fontWeight: 700 }}>From</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
                                {tokens.map(t => (
                                    <button key={t.symbol} onClick={() => intent.tokenOut !== t.symbol && update('tokenIn', t.symbol)} style={{
                                        padding: '16px', borderRadius: '14px', border: `2px solid ${intent.tokenIn === t.symbol ? C.purple : C.cream}`,
                                        cursor: intent.tokenOut === t.symbol ? 'not-allowed' : 'pointer', opacity: intent.tokenOut === t.symbol ? 0.4 : 1,
                                        backgroundColor: intent.tokenIn === t.symbol ? `${C.purple}08` : '#fff',
                                        display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
                                    }}>
                                        <span style={{ fontSize: '24px' }}>{t.icon}</span>
                                        <div><div style={{ fontWeight: 600, color: C.purple }}>{t.symbol}</div><div style={{ fontSize: '13px', color: C.liver }}>{t.balance}</div></div>
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.liver, fontSize: '20px' }}>↓</div>
                            </div>

                            <div style={{ fontSize: '12px', color: C.liver, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', fontWeight: 700 }}>To</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                {tokens.map(t => (
                                    <button key={t.symbol} onClick={() => intent.tokenIn !== t.symbol && update('tokenOut', t.symbol)} style={{
                                        padding: '16px', borderRadius: '14px', border: `2px solid ${intent.tokenOut === t.symbol ? C.purple : C.cream}`,
                                        cursor: intent.tokenIn === t.symbol ? 'not-allowed' : 'pointer', opacity: intent.tokenIn === t.symbol ? 0.4 : 1,
                                        backgroundColor: intent.tokenOut === t.symbol ? `${C.purple}08` : '#fff',
                                        display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
                                    }}>
                                        <span style={{ fontSize: '24px' }}>{t.icon}</span>
                                        <div style={{ fontWeight: 600, color: C.purple }}>{t.symbol}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Amount */}
                    {step === 3 && (
                        <div>
                            <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', color: C.purple }}>Set Amount</h2>
                            <p style={{ color: C.liver, marginBottom: '28px' }}>Configure intent parameters</p>

                            <div style={{ marginBottom: '28px' }}>
                                <div style={{ fontSize: '12px', color: C.liver, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', fontWeight: 700 }}>Amount</div>
                                <div style={{ position: 'relative' }}>
                                    <input type="number" value={intent.amountIn} onChange={e => update('amountIn', e.target.value)} placeholder="0.0" style={{
                                        width: '100%', padding: '18px', paddingRight: '80px', borderRadius: '14px', border: `2px solid ${C.cream}`,
                                        backgroundColor: '#fff', color: C.purple, fontSize: '22px', fontWeight: 600, outline: 'none',
                                    }} />
                                    <span style={{ position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)', color: C.liver, fontWeight: 600, fontSize: '16px' }}>{intent.tokenIn}</span>
                                </div>
                            </div>

                            {intent.type === 'limit' && (
                                <div style={{ marginBottom: '28px' }}>
                                    <div style={{ fontSize: '12px', color: C.liver, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', fontWeight: 700 }}>Target Price</div>
                                    <input type="number" value={intent.targetPrice} onChange={e => update('targetPrice', e.target.value)} placeholder="2000" style={{
                                        width: '100%', padding: '16px', borderRadius: '14px', border: `2px solid ${C.cream}`,
                                        backgroundColor: '#fff', color: C.purple, fontSize: '18px', fontWeight: 600, outline: 'none',
                                    }} />
                                </div>
                            )}

                            <div style={{ marginBottom: '28px' }}>
                                <div style={{ fontSize: '12px', color: C.liver, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', fontWeight: 700 }}>Max Slippage</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {['0.5', '1', '2', '3'].map(v => (
                                        <button key={v} onClick={() => update('slippage', v)} style={{
                                            flex: 1, padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 600,
                                            backgroundColor: v === intent.slippage ? C.purple : C.cream, color: v === intent.slippage ? C.alabaster : C.liver,
                                        }}>{v}%</button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontSize: '12px', color: C.liver, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', fontWeight: 700 }}>Deadline</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {[{ v: '1', l: '1h' }, { v: '24', l: '24h' }, { v: '168', l: '7d' }, { v: '720', l: '30d' }].map(o => (
                                        <button key={o.v} onClick={() => update('deadline', o.v)} style={{
                                            flex: 1, padding: '14px', borderRadius: '12px', border: 'none', cursor: 'pointer', fontWeight: 600,
                                            backgroundColor: o.v === intent.deadline ? C.purple : C.cream, color: o.v === intent.deadline ? C.alabaster : C.liver,
                                        }}>{o.l}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Review */}
                    {step === 4 && (
                        <div>
                            <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', color: C.purple }}>Review Intent</h2>
                            <p style={{ color: C.liver, marginBottom: '28px' }}>Confirm your intent details</p>

                            <div style={{ marginBottom: '28px' }}>
                                {[
                                    { l: 'Type', v: intent.type.toUpperCase() },
                                    { l: 'From', v: `${intent.amountIn} ${intent.tokenIn}` },
                                    { l: 'To', v: intent.tokenOut },
                                    { l: 'Slippage', v: `${intent.slippage}%` },
                                    { l: 'Deadline', v: `${intent.deadline}h` },
                                ].map(row => (
                                    <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: `1px solid ${C.cream}` }}>
                                        <span style={{ color: C.liver, fontWeight: 500 }}>{row.l}</span>
                                        <span style={{ fontWeight: 700, color: C.purple }}>{row.v}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: C.cream, marginBottom: '28px' }}>
                                <div style={{ fontSize: '12px', color: C.liver, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 700 }}>Reactive Predicate</div>
                                <code style={{ color: C.purple, fontFamily: 'monospace', fontSize: '15px', fontWeight: 600 }}>{predicate()}</code>
                            </div>

                            <div style={{ padding: '20px', borderRadius: '16px', backgroundColor: C.cream }}>
                                <div style={{ display: 'flex', gap: '14px' }}>
                                    <span style={{ fontSize: '24px' }}>🔒</span>
                                    <div>
                                        <div style={{ fontWeight: 700, marginBottom: '10px', color: C.purple }}>Security Features</div>
                                        <ul style={{ fontSize: '14px', color: C.liver, margin: 0, paddingLeft: '18px', lineHeight: 1.8 }}>
                                            <li>Commit-reveal for MEV protection</li>
                                            <li>EIP-712 signature verification</li>
                                            <li>Slippage guard: max {intent.slippage}%</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div style={{ display: 'flex', gap: '14px', marginTop: '36px', paddingTop: '28px', borderTop: `1px solid ${C.cream}` }}>
                        {step > 1 && (
                            <button onClick={() => setStep(s => s - 1)} style={{
                                flex: 1, padding: '16px', borderRadius: '14px', cursor: 'pointer', fontWeight: 600, fontSize: '16px',
                                backgroundColor: '#fff', border: `2px solid ${C.cream}`, color: C.purple,
                            }}>Back</button>
                        )}
                        {step < 4 ? (
                            <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()} style={{
                                flex: 1, padding: '16px', borderRadius: '14px', cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: '16px',
                                backgroundColor: C.purple, color: C.alabaster, opacity: canProceed() ? 1 : 0.5,
                            }}>Continue</button>
                        ) : (
                            <button onClick={submit} disabled={loading} style={{
                                flex: 1, padding: '16px', borderRadius: '14px', cursor: 'pointer', border: 'none', fontWeight: 700, fontSize: '16px',
                                backgroundColor: C.purple, color: C.alabaster, opacity: loading ? 0.7 : 1,
                            }}>{loading ? 'Creating...' : 'Create Intent'}</button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
