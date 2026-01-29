import { z } from 'zod';
import { WORKFLOW_STATUS } from '../constants';

export const createWorkflowSchema = z.object({
    name: z.string().min(1, 'Workflow name is required').max(100, 'Workflow name is too long'),
    description: z.string().max(500, 'Description is too long').optional(),
});

export const updateWorkflowSchema = z.object({
    name: z.string().min(1, 'Workflow name is required').max(100, 'Workflow name is too long').optional(),
    description: z.string().max(500, 'Description is too long').optional(),
    status: z.enum([WORKFLOW_STATUS.DRAFT, WORKFLOW_STATUS.VALID, WORKFLOW_STATUS.INVALID]).optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
