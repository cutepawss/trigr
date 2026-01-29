/**
 * Node types supported in the workflow
 */
export const NODE_TYPES = {
    TRIGGER: 'trigger',
    CONDITION: 'condition',
    ACTION: 'action',
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

/**
 * Trigger types
 */
export const TRIGGER_TYPES = {
    TIME_BASED: 'time_based',
    EVENT_BASED: 'event_based',
} as const;

export type TriggerType = (typeof TRIGGER_TYPES)[keyof typeof TRIGGER_TYPES];

/**
 * Comparison operators for conditions
 */
export const OPERATORS = {
    EQ: '==',
    NE: '!=',
    GT: '>',
    GTE: '>=',
    LT: '<',
    LTE: '<=',
} as const;

export type Operator = (typeof OPERATORS)[keyof typeof OPERATORS];

/**
 * Action types
 */
export const ACTION_TYPES = {
    CONTRACT_CALL: 'contract_call',
    EMIT_EVENT: 'emit_event',
} as const;

export type ActionType = (typeof ACTION_TYPES)[keyof typeof ACTION_TYPES];

/**
 * Workflow status
 */
export const WORKFLOW_STATUS = {
    DRAFT: 'draft',
    VALID: 'valid',
    INVALID: 'invalid',
} as const;

export type WorkflowStatus = (typeof WORKFLOW_STATUS)[keyof typeof WORKFLOW_STATUS];

/**
 * Deployment status
 */
export const DEPLOYMENT_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
} as const;

export type DeploymentStatus = (typeof DEPLOYMENT_STATUS)[keyof typeof DEPLOYMENT_STATUS];

/**
 * Execution status
 */
export const EXECUTION_STATUS = {
    SUCCESS: 'success',
    FAILED: 'failed',
    PENDING: 'pending',
} as const;

export type ExecutionStatus = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

/**
 * Gas estimation constants
 */
export const GAS_CONSTANTS = {
    BASE_COST: 21000,
    PER_NODE: 5000,
    STORAGE_WRITE: 20000,
    EXTERNAL_CALL: 10000,
    CONDITION_EVALUATION: 3000,
} as const;

/**
 * Rate limiting constants
 */
export const RATE_LIMITS = {
    LOGIN_ATTEMPTS: 5,
    LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
} as const;

/**
 * Token expiration times
 */
export const TOKEN_EXPIRATION = {
    ACCESS_TOKEN: '15m',
    REFRESH_TOKEN: '7d',
} as const;

/**
 * Argon2 password hashing config
 */
export const ARGON2_CONFIG = {
    TYPE: 2, // argon2id
    MEMORY_COST: 65536, // 64 MB
    TIME_COST: 3,
    PARALLELISM: 1,
} as const;
