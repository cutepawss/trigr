'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/* ============================================
   TRIGR - LANDING PAGE
   Clean, professional design without ugly token boxes
   ============================================ */

export default function LandingPage() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    const bg = '#f1f0ea';
    const card = '#ffffff';
    const accent = '#2d232e';
    const accentLight = '#534b52';
    const text = '#474448';
    const muted = '#8a8687';
    const border = '#e0ddcf';

    return (
        <div style={{ minHeight: '100vh', backgroundColor: bg, color: text, fontFamily: "'Inter', system-ui, sans-serif" }}>

            {/* Header */}
            <header style={{ borderBottom: `1px solid ${border}`, position: 'sticky', top: 0, backgroundColor: `${card}f8`, backdropFilter: 'blur(12px)', zIndex: 100 }}>
                <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${accent} 0%, ${accentLight} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>T</div>
                        <span style={{ fontWeight: 700, fontSize: '20px', color: accent }}>Trigr</span>
                    </div>
                    <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                        <a href="#how-it-works" style={{ fontSize: '14px', color: muted, fontWeight: 500 }}>How It Works</a>
                        <a href="#features" style={{ fontSize: '14px', color: muted, fontWeight: 500 }}>Features</a>
                        <a href="https://learn.rialo.io/tutorials/reactive/" target="_blank" style={{ fontSize: '14px', color: muted, fontWeight: 500 }}>Docs</a>
                        <Link href="/trade" style={{ padding: '10px 20px', background: `linear-gradient(135deg, ${accent} 0%, ${accentLight} 100%)`, borderRadius: '10px', fontWeight: 600, fontSize: '14px', color: '#fff' }}>
                            Launch App
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section style={{ padding: '120px 24px 80px', textAlign: 'center' }}>
                <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: card, borderRadius: '999px', fontSize: '13px', color: text, marginBottom: '28px', border: `1px solid ${border}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                        Built on Rialo Reactive Transactions
                    </div>
                    <h1 style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', color: text, letterSpacing: '-0.02em' }}>
                        Set Your Conditions.<br />
                        <span style={{ color: accent }}>Rialo Executes.</span>
                    </h1>
                    <p style={{ fontSize: '19px', color: muted, lineHeight: 1.7, marginBottom: '40px', maxWidth: '540px', margin: '0 auto 40px' }}>
                        The first trading terminal with native automation. Your orders execute automatically on-chain — no bots, no keepers, no third parties.
                    </p>
                    <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                        <Link href="/trade" style={{ padding: '16px 40px', background: `linear-gradient(135deg, ${accent} 0%, ${accentLight} 100%)`, borderRadius: '12px', fontWeight: 700, fontSize: '16px', color: '#fff', boxShadow: '0 4px 16px rgba(45,35,46,0.25)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            Start Trading <span style={{ fontSize: '18px' }}>→</span>
                        </Link>
                        <a href="https://learn.rialo.io/tutorials/reactive/" target="_blank" style={{ padding: '16px 32px', backgroundColor: card, borderRadius: '12px', fontWeight: 600, fontSize: '16px', color: text, border: `1px solid ${border}` }}>
                            Learn More
                        </a>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" style={{ padding: '100px 24px', backgroundColor: card }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '16px', color: text }}>How Reactive Trading Works</h2>
                        <p style={{ color: muted, fontSize: '17px', maxWidth: '500px', margin: '0 auto' }}>
                            Traditional blockchains need external bots for automation. Rialo's reactive layer executes your conditions natively.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}>
                        {[
                            {
                                num: '01',
                                title: 'Define Your Predicate',
                                desc: 'Set the condition for execution: a target price, a time schedule, or any on-chain state trigger.',
                                code: 'if price(ETH) ≤ $3,200'
                            },
                            {
                                num: '02',
                                title: 'Submit to Rialo',
                                desc: 'Your intent is stored on-chain with its predicate. No external infrastructure needed.',
                                code: 'deploy(intent, predicate)'
                            },
                            {
                                num: '03',
                                title: 'Automatic Execution',
                                desc: 'Validators check your predicate every block. When true, execution is atomic and gas-efficient.',
                                code: 'execute() → success ✓'
                            },
                        ].map(step => (
                            <div key={step.num} style={{ padding: '32px', backgroundColor: bg, borderRadius: '16px', border: `1px solid ${border}` }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: accent, marginBottom: '16px', letterSpacing: '0.5px' }}>{step.num}</div>
                                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: text }}>{step.title}</h3>
                                <p style={{ color: muted, lineHeight: 1.6, fontSize: '15px', marginBottom: '20px' }}>{step.desc}</p>
                                <code style={{ display: 'block', padding: '12px 16px', backgroundColor: card, borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', color: accent, border: `1px solid ${border}` }}>
                                    {step.code}
                                </code>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" style={{ padding: '100px 24px' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                        <h2 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '16px', color: text }}>Order Types</h2>
                        <p style={{ color: muted, fontSize: '17px' }}>
                            Professional trading tools powered by reactive predicates.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                        {[
                            {
                                icon: '⚡',
                                title: 'Market Swap',
                                desc: 'Instant execution with slippage protection. Uses current oracle prices.',
                                predicate: 'Execute immediately with slippage ≤ 2%'
                            },
                            {
                                icon: '📊',
                                title: 'Limit Order',
                                desc: 'Wait for your target price. Executes atomically when the condition is met.',
                                predicate: 'if price(token) ≤ targetPrice'
                            },
                            {
                                icon: '🔄',
                                title: 'DCA (Dollar Cost Averaging)',
                                desc: 'Automated recurring purchases at your schedule — hourly, daily, or weekly.',
                                predicate: 'every 24h for 10 executions'
                            },
                            {
                                icon: '🛡️',
                                title: 'Stop Loss',
                                desc: 'Protect your positions. Automatically sells when price drops below threshold.',
                                predicate: 'if price(token) ≤ stopPrice'
                            },
                        ].map(feature => (
                            <div key={feature.title} style={{ padding: '32px', backgroundColor: card, borderRadius: '16px', border: `1px solid ${border}` }}>
                                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{feature.icon}</div>
                                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: text }}>{feature.title}</h3>
                                <p style={{ color: muted, marginBottom: '20px', lineHeight: 1.6, fontSize: '15px' }}>{feature.desc}</p>
                                <div style={{ padding: '10px 14px', backgroundColor: bg, borderRadius: '8px', display: 'inline-block', border: `1px dashed ${accent}30` }}>
                                    <code style={{ color: accent, fontFamily: 'monospace', fontWeight: 500, fontSize: '13px' }}>{feature.predicate}</code>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Rialo Integration */}
            <section style={{ padding: '80px 24px', backgroundColor: card }}>
                <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '20px', color: text }}>Powered by Rialo's Native Automation</h2>
                    <p style={{ color: muted, fontSize: '16px', lineHeight: 1.7, marginBottom: '32px', maxWidth: '700px', margin: '0 auto 32px' }}>
                        Unlike traditional DeFi that relies on external bots and keepers, Trigr leverages Rialo's reactive transaction layer. Your predicates are evaluated by validators at the protocol level — giving you trustless, gas-efficient automation.
                    </p>
                    <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {[
                            { label: 'No Bots Required', icon: '🤖' },
                            { label: 'Stake-for-Service', icon: '💎' },
                            { label: 'MEV Protected', icon: '🔒' },
                            { label: 'Atomic Execution', icon: '⚛️' },
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: text, fontSize: '14px', fontWeight: 500 }}>
                                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '100px 24px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '40px', fontWeight: 700, marginBottom: '20px', color: text }}>Ready to trade reactively?</h2>
                <p style={{ color: muted, fontSize: '17px', marginBottom: '36px' }}>Set your conditions. Let the protocol handle execution.</p>
                <Link href="/trade" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '18px 48px', background: `linear-gradient(135deg, ${accent} 0%, ${accentLight} 100%)`, borderRadius: '14px', fontWeight: 700, fontSize: '17px', color: '#fff', boxShadow: '0 4px 20px rgba(45,35,46,0.3)' }}>
                    Launch Trigr <span style={{ fontSize: '20px' }}>→</span>
                </Link>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: `1px solid ${border}`, padding: '28px 24px', backgroundColor: card }}>
                <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `linear-gradient(135deg, ${accent} 0%, ${accentLight} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#fff' }}>T</div>
                        <span style={{ fontWeight: 600, fontSize: '15px', color: accent }}>Trigr</span>
                    </div>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', fontSize: '13px', color: muted }}>
                        <a href="https://learn.rialo.io/tutorials/reactive/" target="_blank" style={{ color: muted }}>Rialo Docs</a>
                        <a href="https://www.rialo.io" target="_blank" style={{ color: muted }}>Rialo.io</a>
                        <span>•</span>
                        <span>Built for the Rialo Hackathon</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
