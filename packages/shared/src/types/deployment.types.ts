import { DEPLOYMENT_STATUS, EXECUTION_STATUS } from '../constants';

export type DeploymentStatus = (typeof DEPLOYMENT_STATUS)[keyof typeof DEPLOYMENT_STATUS];
export type ExecutionStatus = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

export interface Deployment {
    id: string;
    workflowId: string;
    status: DeploymentStatus;
    txHash: string | null;
    contractAddress: string | null;
    compiledArtifact: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface DeploymentResult {
    txHash: string;
    contractAddress: string;
    status: DeploymentStatus;
}

export interface DeploymentStatusInfo {
    status: DeploymentStatus;
    txHash: string;
    contractAddress?: string;
    blockNumber?: number;
}

export interface Execution {
    id: string;
    deploymentId: string;
    executionIndex: number;
    status: ExecutionStatus;
    inputState: Record<string, unknown> | null;
    outputState: Record<string, unknown> | null;
    gasUsed: number | null;
    trace: Record<string, unknown> | null;
    createdAt: Date;
}

export interface ExecutionRecord {
    executionId: string;
    status: ExecutionStatus;
    inputState: Record<string, unknown>;
    outputState: Record<string, unknown>;
    gasUsed: number;
    timestamp: number;
}
