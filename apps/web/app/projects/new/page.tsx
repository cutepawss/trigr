'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useCreateProject } from '@/hooks/use-projects';
import Link from 'next/link';

/* ONLY 5 COLORS: #474448, #2d232e, #e0ddcf, #534b52, #f1f0ea */

export default function CreateProjectPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const createProject = useCreateProject();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f1f0ea]">
                <div className="w-8 h-8 border-3 border-[#2d232e] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Project name is required');
            return;
        }
        try {
            const project = await createProject.mutateAsync({
                name: name.trim(),
                description: description.trim()
            });
            router.push(`/projects/${project.id}`);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to create project');
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f0ea]">
            {/* Header */}
            <header className="bg-[#2d232e]">
                <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
                    <Link href="/dashboard" className="text-base font-bold text-[#f1f0ea]">Rialo</Link>
                    <Link href="/dashboard" className="text-xs text-[#e0ddcf] hover:text-[#f1f0ea]">
                        ← Back
                    </Link>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 py-12">
                <div className="bg-[#e0ddcf] rounded-lg p-6 border border-[#534b52]/20">
                    <h1 className="text-lg font-bold text-[#2d232e] mb-1">New Project</h1>
                    <p className="text-sm text-[#534b52] mb-6">
                        Projects contain workflows that automate blockchain operations.
                    </p>

                    {error && (
                        <div className="bg-[#f1f0ea] border border-[#534b52]/30 text-[#2d232e] px-4 py-2 rounded text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] text-[#534b52] uppercase tracking-wider mb-1">
                                Project Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-[#f1f0ea] border border-[#534b52]/30 rounded text-[#2d232e] text-sm focus:outline-none focus:border-[#2d232e]"
                                placeholder="My Automation Project"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] text-[#534b52] uppercase tracking-wider mb-1">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 bg-[#f1f0ea] border border-[#534b52]/30 rounded text-[#2d232e] text-sm focus:outline-none focus:border-[#2d232e] resize-none"
                                placeholder="What will this project automate?"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Link
                                href="/dashboard"
                                className="flex-1 py-2 text-center text-sm border border-[#534b52]/30 text-[#534b52] rounded hover:bg-[#f1f0ea]"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={createProject.isPending}
                                className="flex-1 py-2 text-sm bg-[#2d232e] text-[#f1f0ea] rounded hover:bg-[#474448] disabled:opacity-50"
                            >
                                {createProject.isPending ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
