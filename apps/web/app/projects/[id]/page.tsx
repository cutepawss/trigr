'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useProject } from '@/hooks/use-projects';
import { useWorkflows } from '@/hooks/use-workflows';
import Link from 'next/link';

/* ONLY 5 COLORS: #474448, #2d232e, #e0ddcf, #534b52, #f1f0ea */

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { data: project, isLoading: projectLoading } = useProject(params.id);
    const { data: workflows, isLoading: workflowsLoading } = useWorkflows(params.id);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    if (authLoading || projectLoading || !project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f1f0ea]">
                <div className="w-8 h-8 border-3 border-[#2d232e] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f1f0ea]">
            {/* Header */}
            <header className="bg-[#2d232e]">
                <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="text-base font-bold text-[#f1f0ea]">Rialo</Link>
                        <span className="text-[#534b52]">›</span>
                        <span className="text-sm text-[#e0ddcf]">{project.name}</span>
                    </div>
                    <Link href="/dashboard" className="text-xs text-[#e0ddcf] hover:text-[#f1f0ea]">
                        ← Back
                    </Link>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Project Info */}
                <div className="bg-[#e0ddcf] rounded-lg p-5 mb-8 border border-[#534b52]/20">
                    <h1 className="text-lg font-bold text-[#2d232e] mb-1">{project.name}</h1>
                    <p className="text-sm text-[#534b52]">
                        {project.description || 'No description'}
                    </p>
                </div>

                {/* Workflows Header */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-base font-bold text-[#2d232e]">Workflows</h2>
                        <p className="text-xs text-[#534b52]">
                            Automated tasks that run on Rialo Network
                        </p>
                    </div>
                    <Link
                        href={`/projects/${params.id}/workflows/new`}
                        className="px-4 py-2 text-sm bg-[#2d232e] text-[#f1f0ea] rounded hover:bg-[#474448]"
                    >
                        + New Workflow
                    </Link>
                </div>

                {/* Workflows */}
                {workflowsLoading ? (
                    <div className="text-center py-8">
                        <div className="w-6 h-6 border-2 border-[#2d232e] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                ) : workflows && workflows.length > 0 ? (
                    <div className="bg-[#e0ddcf] rounded-lg border border-[#534b52]/20 overflow-hidden">
                        {workflows.map((workflow, i) => (
                            <div
                                key={workflow.id}
                                className={`p-4 flex items-center justify-between ${i > 0 ? 'border-t border-[#534b52]/20' : ''}`}
                            >
                                <div>
                                    <h3 className="font-medium text-[#2d232e]">{workflow.name}</h3>
                                    <p className="text-xs text-[#534b52]">
                                        {workflow.nodes?.length || 0} components •
                                        Updated {new Date(workflow.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${workflow.status === 'deployed'
                                            ? 'bg-[#2d232e] text-[#e0ddcf]'
                                            : 'bg-[#534b52]/20 text-[#534b52]'
                                        }`}>
                                        {workflow.status || 'draft'}
                                    </span>
                                    <Link
                                        href={`/workflows/${workflow.id}/editor`}
                                        className="text-xs text-[#2d232e] hover:underline font-medium"
                                    >
                                        Edit →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#e0ddcf] rounded-lg p-8 text-center border-2 border-dashed border-[#534b52]/30">
                        <h3 className="font-medium text-[#2d232e] mb-2">No workflows yet</h3>
                        <p className="text-sm text-[#534b52] mb-4">
                            Create a workflow to define automated blockchain operations.
                        </p>
                        <Link
                            href={`/projects/${params.id}/workflows/new`}
                            className="inline-block px-4 py-2 text-sm bg-[#2d232e] text-[#f1f0ea] rounded hover:bg-[#474448]"
                        >
                            + Create First Workflow
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
