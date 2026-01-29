import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(100, 'Project name is too long'),
    description: z.string().max(500, 'Description is too long').optional(),
});

export const updateProjectSchema = z.object({
    name: z.string().min(1, 'Project name is required').max(100, 'Project name is too long').optional(),
    description: z.string().max(500, 'Description is too long').optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
