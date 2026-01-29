import { CompiledWorkflow, WorkflowNode, WorkflowEdge, NODE_TYPES } from '@rialo-builder/shared';

export class CompilationService {
    compile(nodes: WorkflowNode[], edges: WorkflowEdge[]): CompiledWorkflow {
        const trigger = nodes.find(n => n.type === NODE_TYPES.TRIGGER);
        if (!trigger) {
            throw new Error('No trigger node found');
        }

        const conditions = nodes.filter(n => n.type === NODE_TYPES.CONDITION);
        const actions = nodes.filter(n => n.type === NODE_TYPES.ACTION);

        const executionOrder = this.topologicalSort(nodes, edges);

        return {
            workflowId: trigger.workflowId,
            trigger,
            conditions,
            actions,
            executionOrder,
        };
    }

    private topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
        const graph = new Map<string, string[]>();
        const inDegree = new Map<string, number>();

        nodes.forEach(node => {
            graph.set(node.nodeId, []);
            inDegree.set(node.nodeId, 0);
        });

        edges.forEach(edge => {
            const neighbors = graph.get(edge.sourceNodeId) || [];
            neighbors.push(edge.targetNodeId);
            graph.set(edge.sourceNodeId, neighbors);
            inDegree.set(edge.targetNodeId, (inDegree.get(edge.targetNodeId) || 0) + 1);
        });

        const queue: string[] = [];
        inDegree.forEach((degree, nodeId) => {
            if (degree === 0) {
                queue.push(nodeId);
            }
        });

        const result: string[] = [];
        while (queue.length > 0) {
            const current = queue.shift()!;
            result.push(current);

            const neighbors = graph.get(current) || [];
            neighbors.forEach(neighbor => {
                const newDegree = (inDegree.get(neighbor) || 0) - 1;
                inDegree.set(neighbor, newDegree);
                if (newDegree === 0) {
                    queue.push(neighbor);
                }
            });
        }

        return result;
    }

    generateCode(compiled: CompiledWorkflow): string {
        const lines: string[] = [];

        lines.push('// Auto-generated Rialo Reactive Transaction');
        lines.push('// Workflow ID: ' + compiled.workflowId);
        lines.push('');
        lines.push('pub struct ReactiveTransaction {');
        lines.push('    // State variables');
        lines.push('}');
        lines.push('');
        lines.push('impl ReactiveTransaction {');
        lines.push('    // Trigger');
        const triggerConfig = compiled.trigger.config as any;
        if (triggerConfig.triggerType === 'time_based') {
            lines.push(`    // Time-based trigger: every ${triggerConfig.interval} seconds`);
        } else {
            lines.push(`    // Event-based trigger: ${triggerConfig.eventName}`);
        }
        lines.push('');

        if (compiled.conditions.length > 0) {
            lines.push('    // Conditions');
            compiled.conditions.forEach((condition, idx) => {
                const config = condition.config as any;
                lines.push(`    // Condition ${idx + 1}: ${config.leftOperand} ${config.operator} ${config.rightOperand}`);
            });
            lines.push('');
        }

        lines.push('    // Actions');
        compiled.actions.forEach((action, idx) => {
            const config = action.config as any;
            if (config.actionType === 'contract_call') {
                lines.push(`    // Action ${idx + 1}: Call ${config.contractAddress}.${config.functionName}()`);
            } else {
                lines.push(`    // Action ${idx + 1}: Emit ${config.eventName}`);
            }
        });

        lines.push('}');

        return lines.join('\n');
    }
}
