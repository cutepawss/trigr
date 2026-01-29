'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/* ============================================
   INTENT DASHBOARD - LIGHT THEME
   Palette: #474448, #2d232e, #e0ddcf, #534b52, #f1f0ea
   ============================================ */

const C = {
    gray: '#474448',
    purple: '#2d232e',
    cream: '#e0ddcf',
    liver: '#534b52',
    alabaster: '#f1f0ea',
};

interface Intent {
    id: string; type: 'swap' | 'limit' | 'dca'; status: 'pending' | 'active' | 'executed' | 'expired';
    tokenIn: string; tokenOut: string; amountIn: string; deadline: number; predicate: string;
}

const mockIntents: Intent[] = [
    { id: '0x1a2b', type: 'swap', status: 'active', tokenIn: 'USDC', tokenOut: 'ETH', amountIn: '1000', deadline: Date.now() + 86400000, predicate: 'price(ETH) <= 2000' },
    { id: '0x3c4d', type: 'limit', status: 'pending', tokenIn: 'ETH', tokenOut: 'USDC', amountIn: '1', deadline: Date.now() + 172800000, predicate: 'price(ETH) >= 2200' },
    { id: '0x5e6f', type: 'dca', status: 'executed', tokenIn: 'USDC', tokenOut: 'BTC', amountIn: '500', deadline: Date.now() - 3600000, predicate: 'interval(1 day)' },
];

const statusColors: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#fef3cd', text: '#856404' },
    active: { bg: '#d4edda', text: '#155724' },
    executed: { bg: C.cream, text: C.liver },
    expired: { bg: '#f8d7da', text: '#721c24' },
};

const typeIcons: Record<string, string> = { swap: '⇄', limit: '📊', dca: '📅' };

export default function IntentsPage() {
    const [intents, setIntents] = useState<Intent[]>([]);
    const [filter, setFilter] = useState('all');
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); setIntents(mockIntents); }, []);
    if (!mounted) return null;

    const filtered = intents.filter(i => filter === 'all' ? true : filter === 'active' ? ['pending', 'active'].includes(i.status) : i.status === 'executed');
    const formatTime = (dl: number) => { const h = Math.floor((dl - Date.now()) / 3600000); return h < 0 ? 'Expired' : h > 24 ? `${Math.floor(h / 24)}d left` : `${h}h left`; };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: C.alabaster, color: C.gray }}>
            {/* Nav */}
            <nav style={{ backgroundColor: `${C.alabaster}f5`, borderBottom: `1px solid ${C.cream}`, backdropFilter: 'blur(8px)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: C.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.alabaster, fontWeight: 'bold', fontSize: '18px' }}>R</div>
                        <span style={{ color: C.purple, fontWeight: 700, fontSize: '20px' }}>RRI</span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <span style={{ fontSize: '15px', color: C.purple, fontWeight: 600, borderBottom: `2px solid ${C.purple}`, paddingBottom: '4px' }}>Dashboard</span>
                        <Link href="/intents/create" style={{ backgroundColor: C.purple, color: C.alabaster, padding: '12px 24px', borderRadius: '10px', fontWeight: 600, fontSize: '15px' }}>+ New Intent</Link>
                    </div>
                </div>
            </nav>

            <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '8px', color: C.purple }}>Intent Dashboard</h1>
                        <p style={{ color: C.liver, fontSize: '16px' }}>Monitor and manage your reactive intents</p>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', padding: '4px', backgroundColor: C.cream, borderRadius: '12px' }}>
                        {['all', 'active', 'executed'].map(f => (
                            <button key={f} onClick={() => setFilter(f)} style={{
                                padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                                backgroundColor: filter === f ? C.purple : 'transparent',
                                color: filter === f ? C.alabaster : C.liver,
                            }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    {[
                        { label: 'Total Intents', value: intents.length },
                        { label: 'Active', value: intents.filter(i => i.status === 'active').length },
                        { label: 'Executed', value: intents.filter(i => i.status === 'executed').length },
                        { label: 'Success Rate', value: '100%' },
                    ].map(s => (
                        <div key={s.label} style={{ padding: '24px', borderRadius: '16px', backgroundColor: C.cream }}>
                            <div style={{ fontSize: '12px', color: C.liver, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>{s.label}</div>
                            <div style={{ fontSize: '32px', fontWeight: 800, color: C.purple }}>{s.value}</div>
                        </div>
                    ))}
                </div>

                {/* Intent List */}
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 24px', borderRadius: '20px', backgroundColor: C.cream }}>
                        <div style={{ fontSize: '56px', marginBottom: '16px' }}>📭</div>
                        <h3 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px', color: C.purple }}>No intents found</h3>
                        <p style={{ color: C.liver, marginBottom: '24px' }}>Create your first intent to get started</p>
                        <Link href="/intents/create" style={{ backgroundColor: C.purple, color: C.alabaster, padding: '14px 28px', borderRadius: '12px', fontWeight: 600, display: 'inline-block' }}>Create Intent</Link>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {filtered.map(intent => (
                            <div key={intent.id} style={{
                                backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '20px',
                                border: `1px solid ${C.cream}`,
                            }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>{typeIcons[intent.type]}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '17px', color: C.purple }}>{intent.amountIn} {intent.tokenIn} → {intent.tokenOut}</span>
                                        <span style={{ padding: '5px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, backgroundColor: statusColors[intent.status].bg, color: statusColors[intent.status].text }}>{intent.status}</span>
                                    </div>
                                    <div style={{ fontSize: '14px', color: C.liver }}><span style={{ color: C.gray }}>Predicate:</span> {intent.predicate}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '15px', color: C.gray, fontWeight: 500 }}>{formatTime(intent.deadline)}</div>
                                    <div style={{ fontSize: '13px', color: C.liver }}>ID: {intent.id}</div>
                                </div>
                                <div style={{ color: C.liver, fontSize: '20px' }}>→</div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
