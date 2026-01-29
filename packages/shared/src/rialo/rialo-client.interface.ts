import {
    CompiledWorkflow,
    GasEstimate,
    DeploymentResult,
    DeploymentStatusInfo,
    ExecutionRecord,
} from '../types';

export interface DeploymentArtifact {
    workflowId: string;
    compiledCode: string;
    metadata: {
        version: string;
        compiler: string;
        timestamp: number;
    };
}

export interface RialoClient {
    estimateGas(workflow: CompiledWorkflow): Promise<GasEstimate>;
    deployReactiveTransaction(artifact: DeploymentArtifact): Promise<DeploymentResult>;
    getDeploymentStatus(txHash: string): Promise<DeploymentStatusInfo>;
    listExecutions(contractAddress: string, cursor?: string): Promise<{
        executions: ExecutionRecord[];
        nextCursor?: string;
    }>;
}
