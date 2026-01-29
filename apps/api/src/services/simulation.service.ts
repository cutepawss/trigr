import {
    CompiledWorkflow,
    SimulationInput,
    SimulationResult,
    SimulationStep,
    NODE_TYPES,
    GAS_CONSTANTS,
} from '@rialo-builder/shared';

export class SimulationService {
    simulate(compiled: CompiledWorkflow, input: SimulationInput): SimulationResult {
        const steps: SimulationStep[] = [];
        let currentState = { ...input.initialState };
        let totalGasUsed = GAS_CONSTANTS.BASE_COST;
        let success = true;
        let error: string | undefined;

        try {
            // Execute trigger (always true in simulation)
            steps.push({
                nodeId: compiled.trigger.nodeId,
                nodeType: NODE_TYPES.TRIGGER,
                result: { triggered: true },
                gasUsed: GAS_CONSTANTS.PER_NODE,
                timestamp: Date.now(),
            });
            totalGasUsed += GAS_CONSTANTS.PER_NODE;

            // Execute conditions
            for (const condition of compiled.conditions) {
                const config = condition.config as any;
                const { leftOperand, operator, rightOperand } = config;

                const leftValue = this.evaluateOperand(leftOperand, currentState);
                const conditionResult = this.evaluateCondition(leftValue, operator, rightOperand);

                steps.push({
                    nodeId: condition.nodeId,
                    nodeType: NODE_TYPES.CONDITION,
                    result: { passed: conditionResult, leftValue, operator, rightOperand },
                    gasUsed: GAS_CONSTANTS.CONDITION_EVALUATION,
                    timestamp: Date.now(),
                });
                totalGasUsed += GAS_CONSTANTS.CONDITION_EVALUATION;

                if (!conditionResult) {
                    success = false;
                    error = `Condition failed: ${leftOperand} ${operator} ${rightOperand}`;
                    break;
                }
            }

            // Execute actions if all conditions passed
            if (success) {
                for (const action of compiled.actions) {
                    const config = action.config as any;
                    let gasUsed = GAS_CONSTANTS.PER_NODE + GAS_CONSTANTS.STORAGE_WRITE;

                    if (config.actionType === 'contract_call') {
                        gasUsed += GAS_CONSTANTS.EXTERNAL_CALL;
                        steps.push({
                            nodeId: action.nodeId,
                            nodeType: NODE_TYPES.ACTION,
                            result: {
                                type: 'contract_call',
                                address: config.contractAddress,
                                function: config.functionName,
                                executed: true,
                            },
                            gasUsed,
                            timestamp: Date.now(),
                        });

                        // Simulate state change
                        currentState = {
                            ...currentState,
                            lastAction: {
                                type: 'contract_call',
                                address: config.contractAddress,
                                function: config.functionName,
                            },
                        };
                    } else if (config.actionType === 'emit_event') {
                        steps.push({
                            nodeId: action.nodeId,
                            nodeType: NODE_TYPES.ACTION,
                            result: {
                                type: 'emit_event',
                                eventName: config.eventName,
                                payload: config.payload,
                                emitted: true,
                            },
                            gasUsed,
                            timestamp: Date.now(),
                        });

                        currentState = {
                            ...currentState,
                            lastEvent: {
                                name: config.eventName,
                                payload: config.payload,
                            },
                        };
                    }

                    totalGasUsed += gasUsed;
                }
            }
        } catch (err: any) {
            success = false;
            error = err.message;
        }

        return {
            workflowId: compiled.workflowId,
            finalState: currentState,
            steps,
            totalGasUsed,
            success,
            error,
        };
    }

    private evaluateOperand(operand: string, state: Record<string, any>): any {
        const parts = operand.split('.');
        let value = state;

        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            } else {
                return undefined;
            }
        }

        return value;
    }

    private evaluateCondition(leftValue: any, operator: string, rightValue: any): boolean {
        switch (operator) {
            case '==':
                return leftValue == rightValue;
            case '!=':
                return leftValue != rightValue;
            case '>':
                return Number(leftValue) > Number(rightValue);
            case '>=':
                return Number(leftValue) >= Number(rightValue);
            case '<':
                return Number(leftValue) < Number(rightValue);
            case '<=':
                return Number(leftValue) <= Number(rightValue);
            default:
                return false;
        }
    }
}
