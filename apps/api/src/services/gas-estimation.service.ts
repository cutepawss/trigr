import { CompiledWorkflow, GasEstimate, GAS_CONSTANTS, ACTION_TYPES } from '@rialo-builder/shared';

export class GasEstimationService {
    estimate(compiled: CompiledWorkflow): GasEstimate {
        const breakdown = {
            base: GAS_CONSTANTS.BASE_COST,
            nodes: 0,
            storageWrites: 0,
            externalCalls: 0,
            conditions: compiled.conditions.length * GAS_CONSTANTS.CONDITION_EVALUATION,
        };

        const totalNodes = 1 + compiled.conditions.length + compiled.actions.length;
        breakdown.nodes = totalNodes * GAS_CONSTANTS.PER_NODE;

        breakdown.storageWrites = compiled.actions.length * GAS_CONSTANTS.STORAGE_WRITE;

        compiled.actions.forEach(action => {
            const config = action.config as any;
            if (config.actionType === ACTION_TYPES.CONTRACT_CALL) {
                breakdown.externalCalls += GAS_CONSTANTS.EXTERNAL_CALL;
            }
        });

        const total =
            breakdown.base +
            breakdown.nodes +
            breakdown.storageWrites +
            breakdown.externalCalls +
            breakdown.conditions;

        return {
            total,
            breakdown,
            workflowId: compiled.workflowId,
            estimatedAt: new Date(),
        };
    }
}
