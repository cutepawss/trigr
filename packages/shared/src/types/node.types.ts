import { NODE_TYPES, TRIGGER_TYPES, OPERATORS, ACTION_TYPES } from '../constants';

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];
export type TriggerType = (typeof TRIGGER_TYPES)[keyof typeof TRIGGER_TYPES];
export type Operator = (typeof OPERATORS)[keyof typeof OPERATORS];
export type ActionType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES];

/**
 * Trigger node configuration
 */
export interface TriggerNodeConfig {
    triggerType: TriggerType;
    interval?: number;
    eventName?: string;
}

/**
 * Condition node configuration
 */
export interface ConditionNodeConfig {
    leftOperand: string;
    operator: Operator;
    rightOperand: string | number | boolean;
}

/**
 * Action node configuration - contract call
 */
export interface ContractCallActionConfig {
    actionType: typeof ACTION_TYPES.CONTRACT_CALL;
    contractAddress: string;
    functionName: string;
    parameters: Array<{
        name: string;
        type: string;
        value: string;
    }>;
}

/**
 * Action node configuration - emit event
 */
export interface EmitEventActionConfig {
    actionType: typeof ACTION_TYPES.EMIT_EVENT;
    eventName: string;
    payload: Record<string, unknown>;
}

export type ActionNodeConfig = ContractCallActionConfig | EmitEventActionConfig;
export type NodeConfig = TriggerNodeConfig | ConditionNodeConfig | ActionNodeConfig;

export interface NodePosition {
    x: number;
    y: number;
}

export interface WorkflowNode {
    id: string;
    workflowId: string;
    nodeId: string;
    type: NodeType;
    config: NodeConfig;
    position: NodePosition;
    createdAt: Date;
}

export interface WorkflowEdge {
    id: string;
    workflowId: string;
    sourceNodeId: string;
    targetNodeId: string;
    createdAt: Date;
}
