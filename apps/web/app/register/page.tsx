'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

/* ONLY 5 COLORS: #474448, #2d232e, #e0ddcf, #534b52, #f1f0ea */

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            await register({ email, password });
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#f1f0ea]">
            {/* Left */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#2d232e] p-12 flex-col justify-between">
                <div>
                    <Link href="/" className="text-xl font-bold text-[#f1f0ea]">Rialo Builder</Link>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-[#f1f0ea] mb-4">
                        Build automated<br />blockchain workflows.
                    </h2>
                    <div className="text-sm text-[#e0ddcf] space-y-2">
                        <p>• Define triggers (when to run)</p>
                        <p>• Set conditions (if/then logic)</p>
                        <p>• Execute actions (contract calls)</p>
                    </div>
                </div>
                <p className="text-xs text-[#534b52]">© 2024 Rialo Builder</p>
            </div>

            {/* Right */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-sm">
                    <div className="lg:hidden mb-6">
                        <Link href="/" className="text-lg font-bold text-[#2d232e]">Rialo Builder</Link>
                    </div>

                    <h2 className="text-xl font-bold text-[#2d232e] mb-1">Create account</h2>
                    <p className="text-sm text-[#534b52] mb-6">Start building automations</p>

                    {error && (
                        <div className="bg-[#e0ddcf] border border-[#534b52]/30 text-[#2d232e] px-4 py-2 rounded text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] text-[#534b52] uppercase tracking-wider mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 bg-[#e0ddcf] border border-[#534b52]/30 rounded text-[#2d232e] text-sm focus:outline-none focus:border-[#2d232e]"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-[#534b52] uppercase tracking-wider mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-[#e0ddcf] border border-[#534b52]/30 rounded text-[#2d232e] text-sm focus:outline-none focus:border-[#2d232e]"
                                placeholder="Min 8 chars, uppercase, number, special"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] text-[#534b52] uppercase tracking-wider mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 bg-[#e0ddcf] border border-[#534b52]/30 rounded text-[#2d232e] text-sm focus:outline-none focus:border-[#2d232e]"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-[#2d232e] text-[#f1f0ea] rounded hover:bg-[#474448] disabled:opacity-50 text-sm"
                        >
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-[#534b52]">
                        Have an account? <Link href="/login" className="text-[#2d232e] hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
