import { z } from 'zod';
import { NODE_TYPES, TRIGGER_TYPES, OPERATORS, ACTION_TYPES } from '../constants';

export const nodePositionSchema = z.object({
    x: z.number(),
    y: z.number(),
});

export const triggerNodeConfigSchema = z.object({
    triggerType: z.enum([TRIGGER_TYPES.TIME_BASED, TRIGGER_TYPES.EVENT_BASED]),
    interval: z.number().int().positive().optional(),
    eventName: z.string().min(1).optional(),
}).refine(
    data => {
        if (data.triggerType === TRIGGER_TYPES.TIME_BASED) {
            return data.interval !== undefined && data.interval > 0;
        }
        if (data.triggerType === TRIGGER_TYPES.EVENT_BASED) {
            return data.eventName !== undefined && data.eventName.length > 0;
        }
        return false;
    },
    { message: 'Invalid trigger configuration' }
);

export const conditionNodeConfigSchema = z.object({
    leftOperand: z.string().min(1, 'Left operand is required'),
    operator: z.enum([OPERATORS.EQ, OPERATORS.NE, OPERATORS.GT, OPERATORS.GTE, OPERATORS.LT, OPERATORS.LTE]),
    rightOperand: z.union([z.string(), z.number(), z.boolean()]),
});

export const contractCallActionConfigSchema = z.object({
    actionType: z.literal(ACTION_TYPES.CONTRACT_CALL),
    contractAddress: z.string().min(1, 'Contract address is required'),
    functionName: z.string().min(1, 'Function name is required'),
    parameters: z.array(
        z.object({
            name: z.string().min(1),
            type: z.string().min(1),
            value: z.string(),
        })
    ),
});

export const emitEventActionConfigSchema = z.object({
    actionType: z.literal(ACTION_TYPES.EMIT_EVENT),
    eventName: z.string().min(1, 'Event name is required'),
    payload: z.record(z.unknown()),
});

export const actionNodeConfigSchema = z.union([
    contractCallActionConfigSchema,
    emitEventActionConfigSchema,
]);

export const createNodeSchema = z.object({
    nodeId: z.string().min(1, 'Node ID is required'),
    type: z.enum([NODE_TYPES.TRIGGER, NODE_TYPES.CONDITION, NODE_TYPES.ACTION]),
    config: z.union([triggerNodeConfigSchema, conditionNodeConfigSchema, actionNodeConfigSchema]),
    position: nodePositionSchema,
});

export const updateNodeSchema = z.object({
    config: z.union([triggerNodeConfigSchema, conditionNodeConfigSchema, actionNodeConfigSchema]).optional(),
    position: nodePositionSchema.optional(),
});

export const createEdgeSchema = z.object({
    sourceNodeId: z.string().min(1, 'Source node ID is required'),
    targetNodeId: z.string().min(1, 'Target node ID is required'),
});

export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodeInput = z.infer<typeof updateNodeSchema>;
export type CreateEdgeInput = z.infer<typeof createEdgeSchema>;
