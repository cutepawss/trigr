'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useProjects } from '@/hooks/use-projects';
import Link from 'next/link';

/* ONLY 5 COLORS: #474448, #2d232e, #e0ddcf, #534b52, #f1f0ea */

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading, logout } = useAuth();
    const { data: projects, isLoading } = useProjects();

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    if (authLoading || !user) {
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
                    <span className="text-base font-bold text-[#f1f0ea]">Rialo Builder</span>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-[#534b52]">{user.email}</span>
                        <button onClick={logout} className="text-xs text-[#e0ddcf] hover:text-[#f1f0ea]">
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-8">
                {/* Info */}
                <div className="bg-[#2d232e] rounded-lg p-5 mb-8">
                    <h1 className="text-lg font-bold text-[#f1f0ea] mb-1">Dashboard</h1>
                    <p className="text-sm text-[#e0ddcf]">
                        Manage your automation projects. Each project contains workflows that
                        automatically execute blockchain operations based on your rules.
                    </p>
                </div>

                {/* Projects Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-bold text-[#2d232e]">Projects</h2>
                    <Link
                        href="/projects/new"
                        className="px-4 py-2 text-sm bg-[#2d232e] text-[#f1f0ea] rounded hover:bg-[#474448]"
                    >
                        + New Project
                    </Link>
                </div>

                {/* Projects */}
                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="w-6 h-6 border-2 border-[#2d232e] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                ) : projects && projects.length > 0 ? (
                    <div className="grid gap-3">
                        {projects.map((project) => (
                            <Link key={project.id} href={`/projects/${project.id}`}>
                                <div className="bg-[#e0ddcf] rounded-lg p-4 border border-[#534b52]/20 hover:border-[#2d232e] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#2d232e] rounded flex items-center justify-center text-[#f1f0ea] text-sm font-bold">
                                            {project.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-[#2d232e]">{project.name}</h3>
                                            <p className="text-xs text-[#534b52]">
                                                {project.description || 'No description'}
                                            </p>
                                        </div>
                                        <span className="text-xs text-[#534b52]">
                                            {new Date(project.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="bg-[#e0ddcf] rounded-lg p-8 text-center border-2 border-dashed border-[#534b52]/30">
                        <h3 className="font-medium text-[#2d232e] mb-2">No projects yet</h3>
                        <p className="text-sm text-[#534b52] mb-4">
                            Create your first project to start building automations.
                        </p>
                        <Link
                            href="/projects/new"
                            className="inline-block px-4 py-2 text-sm bg-[#2d232e] text-[#f1f0ea] rounded hover:bg-[#474448]"
                        >
                            + Create First Project
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
