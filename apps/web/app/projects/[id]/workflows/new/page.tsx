'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useProject } from '@/hooks/use-projects';
import { useCreateWorkflow } from '@/hooks/use-workflows';
import Link from 'next/link';

/* ONLY 5 COLORS: #474448, #2d232e, #e0ddcf, #534b52, #f1f0ea */

export default function CreateWorkflowPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { data: project, isLoading: projectLoading } = useProject(params.id);
    const createWorkflow = useCreateWorkflow(params.id);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    if (authLoading || projectLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f1f0ea]">
                <div className="w-8 h-8 border-3 border-[#2d232e] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f1f0ea]">
                <div className="text-center">
                    <h2 className="text-lg font-bold text-[#2d232e] mb-2">Project not found</h2>
                    <Link href="/dashboard" className="text-sm text-[#534b52] hover:underline">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('Workflow name is required');
            return;
        }
        try {
            const workflow = await createWorkflow.mutateAsync({
                name: name.trim(),
                description: description.trim()
            });
            router.push(`/workflows/${workflow.id}/editor`);
        } catch (err: any) {
            setError(err.response?.data?.error?.message || 'Failed to create workflow');
        }
    };

    return (
        <div className="min-h-screen bg-[#f1f0ea]">
            {/* Header */}
            <header className="bg-[#2d232e]">
                <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="text-base font-bold text-[#f1f0ea]">Rialo</Link>
                        <span className="text-[#534b52]">›</span>
                        <Link href={`/projects/${params.id}`} className="text-sm text-[#e0ddcf] hover:text-[#f1f0ea]">
                            {project.name}
                        </Link>
                    </div>
                    <Link href={`/projects/${params.id}`} className="text-xs text-[#e0ddcf] hover:text-[#f1f0ea]">
                        ← Back
                    </Link>
                </div>
            </header>

            <main className="max-w-md mx-auto px-6 py-12">
                <div className="bg-[#e0ddcf] rounded-lg p-6 border border-[#534b52]/20">
                    <h1 className="text-lg font-bold text-[#2d232e] mb-1">New Workflow</h1>
                    <p className="text-sm text-[#534b52] mb-6">
                        Define automated operations that execute on the blockchain.
                    </p>

                    {error && (
                        <div className="bg-[#f1f0ea] border border-[#534b52]/30 text-[#2d232e] px-4 py-2 rounded text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-[10px] text-[#534b52] uppercase tracking-wider mb-1">
                                Workflow Name *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 bg-[#f1f0ea] border border-[#534b52]/30 rounded text-[#2d232e] text-sm focus:outline-none focus:border-[#2d232e]"
                                placeholder="e.g., Balance Monitor, Price Alert"
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
                                placeholder="What does this workflow do?"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Link
                                href={`/projects/${params.id}`}
                                className="flex-1 py-2 text-center text-sm border border-[#534b52]/30 text-[#534b52] rounded hover:bg-[#f1f0ea]"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={createWorkflow.isPending}
                                className="flex-1 py-2 text-sm bg-[#2d232e] text-[#f1f0ea] rounded hover:bg-[#474448] disabled:opacity-50"
                            >
                                {createWorkflow.isPending ? 'Creating...' : 'Create & Open Editor'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
