import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ValidationService } from '../src/services/validation.service';
import { CompilationService } from '../src/services/compilation.service';
import { SimulationService } from '../src/services/simulation.service';

describe('ValidationService', () => {
    let validationService: ValidationService;

    beforeEach(() => {
        validationService = new ValidationService();
    });

    describe('validate', () => {
        it('should return valid for correct workflow', () => {
            const nodes = [
                { id: '1', nodeId: 'trigger-1', type: 'trigger', config: { triggerType: 'time' }, position: { x: 0, y: 0 } },
                { id: '2', nodeId: 'action-1', type: 'action', config: { actionType: 'contract_call' }, position: { x: 200, y: 0 } },
            ];
            const edges = [
                { id: '1', sourceNodeId: 'trigger-1', targetNodeId: 'action-1' },
            ];

            const result = validationService.validate(nodes, edges);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject workflow without trigger', () => {
            const nodes = [
                { id: '1', nodeId: 'action-1', type: 'action', config: {}, position: { x: 0, y: 0 } },
            ];
            const edges: any[] = [];

            const result = validationService.validate(nodes, edges);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.message.includes('trigger'))).toBe(true);
        });

        it('should reject workflow without action', () => {
            const nodes = [
                { id: '1', nodeId: 'trigger-1', type: 'trigger', config: {}, position: { x: 0, y: 0 } },
            ];
            const edges: any[] = [];

            const result = validationService.validate(nodes, edges);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.message.includes('action'))).toBe(true);
        });
    });
});

describe('CompilationService', () => {
    let compilationService: CompilationService;

    beforeEach(() => {
        compilationService = new CompilationService();
    });

    describe('compile', () => {
        it('should compile workflow to intermediate representation', () => {
            const nodes = [
                { id: '1', nodeId: 'trigger-1', type: 'trigger', config: { triggerType: 'time', interval: 60 }, position: { x: 0, y: 0 } },
                { id: '2', nodeId: 'action-1', type: 'action', config: { actionType: 'contract_call' }, position: { x: 200, y: 0 } },
            ];
            const edges = [
                { id: '1', sourceNodeId: 'trigger-1', targetNodeId: 'action-1' },
            ];

            const result = compilationService.compile(nodes, edges);

            expect(result).toBeDefined();
            expect(result.nodes).toHaveLength(2);
            expect(result.edges).toHaveLength(1);
        });
    });

    describe('generateCode', () => {
        it('should generate Rust code from compiled workflow', () => {
            const compiled = {
                nodes: [
                    { id: 'trigger-1', type: 'trigger', config: { triggerType: 'time', interval: 60 } },
                    { id: 'action-1', type: 'action', config: { actionType: 'contract_call' } },
                ],
                edges: [
                    { source: 'trigger-1', target: 'action-1' },
                ],
            };

            const code = compilationService.generateCode(compiled);

            expect(code).toContain('fn');
            expect(typeof code).toBe('string');
        });
    });
});

describe('SimulationService', () => {
    let simulationService: SimulationService;

    beforeEach(() => {
        simulationService = new SimulationService();
    });

    describe('simulate', () => {
        it('should simulate workflow execution', () => {
            const compiled = {
                nodes: [
                    { id: 'trigger-1', type: 'trigger', config: { triggerType: 'time', interval: 60 } },
                    { id: 'condition-1', type: 'condition', config: { leftOperand: 'balance', operator: 'gt', rightOperand: 100 } },
                    { id: 'action-1', type: 'action', config: { actionType: 'emit_event', eventName: 'LowBalance' } },
                ],
                edges: [
                    { source: 'trigger-1', target: 'condition-1' },
                    { source: 'condition-1', target: 'action-1' },
                ],
            };
            const initialState = { balance: 1000 };

            const result = simulationService.simulate(compiled, { initialState });

            expect(result).toBeDefined();
            expect(result.success).toBeDefined();
            expect(result.gasUsed).toBeGreaterThan(0);
            expect(result.finalState).toBeDefined();
        });
    });
});
