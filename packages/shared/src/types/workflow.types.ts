import { WorkflowNode, WorkflowEdge } from './node.types';
import { WORKFLOW_STATUS } from '../constants';

export type WorkflowStatus = (typeof WORKFLOW_STATUS)[keyof typeof WORKFLOW_STATUS];

export interface Workflow {
    id: string;
    projectId: string;
    name: string;
    description: string | null;
    status: WorkflowStatus;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    nodes?: WorkflowNode[];
    edges?: WorkflowEdge[];
}

export interface CreateWorkflowData {
    name: string;
    description?: string;
}

export interface UpdateWorkflowData {
    name?: string;
    description?: string;
    status?: WorkflowStatus;
}

export interface ValidationError {
    code: string;
    message: string;
    nodeId?: string;
    severity: 'error' | 'warning';
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}

export interface CompiledWorkflow {
    workflowId: string;
    trigger: WorkflowNode;
    conditions: WorkflowNode[];
    actions: WorkflowNode[];
    executionOrder: string[];
}

export interface GasBreakdown {
    base: number;
    nodes: number;
    storageWrites: number;
    externalCalls: number;
    conditions: number;
}

export interface GasEstimate {
    total: number;
    breakdown: GasBreakdown;
    workflowId: string;
    estimatedAt: Date;
}

export interface GeneratedCode {
    workflowId: string;
    code: string;
    language: 'rust' | 'solidity';
    generatedAt: Date;
}

export interface SimulationInput {
    initialState: Record<string, unknown>;
}

export interface SimulationStep {
    nodeId: string;
    nodeType: string;
    result: unknown;
    gasUsed: number;
    timestamp: number;
}

export interface SimulationResult {
    workflowId: string;
    finalState: Record<string, unknown>;
    steps: SimulationStep[];
    totalGasUsed: number;
    success: boolean;
    error?: string;
}
