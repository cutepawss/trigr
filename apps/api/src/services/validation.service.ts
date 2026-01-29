import { ValidationResult, ValidationError, WorkflowNode, WorkflowEdge, NODE_TYPES } from '@rialo-builder/shared';

export class ValidationService {
    validate(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationError[] = [];

        // Check for exactly one trigger
        const triggers = nodes.filter(n => n.type === NODE_TYPES.TRIGGER);
        if (triggers.length === 0) {
            errors.push({
                code: 'NO_TRIGGER',
                message: 'Workflow must have exactly one trigger node',
                severity: 'error',
            });
        } else if (triggers.length > 1) {
            errors.push({
                code: 'MULTIPLE_TRIGGERS',
                message: 'Workflow must have exactly one trigger node',
                severity: 'error',
            });
        }

        // Check for at least one action
        const actions = nodes.filter(n => n.type === NODE_TYPES.ACTION);
        if (actions.length === 0) {
            errors.push({
                code: 'NO_ACTION',
                message: 'Workflow must have at least one action node',
                severity: 'error',
            });
        }

        // Check for orphan nodes
        const nodeIds = new Set(nodes.map(n => n.nodeId));
        const connectedNodes = new Set<string>();

        edges.forEach(edge => {
            connectedNodes.add(edge.sourceNodeId);
            connectedNodes.add(edge.targetNodeId);
        });

        nodes.forEach(node => {
            if (!connectedNodes.has(node.nodeId) && nodes.length > 1) {
                warnings.push({
                    code: 'ORPHAN_NODE',
                    message: `Node ${node.nodeId} is not connected`,
                    nodeId: node.nodeId,
                    severity: 'warning',
                });
            }
        });

        // Check for cycles (DAG validation)
        if (this.hasCycle(nodes, edges)) {
            errors.push({
                code: 'CYCLE_DETECTED',
                message: 'Workflow contains cycles',
                severity: 'error',
            });
        }

        // Check for invalid edges
        edges.forEach(edge => {
            if (!nodeIds.has(edge.sourceNodeId)) {
                errors.push({
                    code: 'INVALID_EDGE',
                    message: `Source node ${edge.sourceNodeId} does not exist`,
                    severity: 'error',
                });
            }
            if (!nodeIds.has(edge.targetNodeId)) {
                errors.push({
                    code: 'INVALID_EDGE',
                    message: `Target node ${edge.targetNodeId} does not exist`,
                    severity: 'error',
                });
            }
        });

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    private hasCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
        const graph = new Map<string, string[]>();

        nodes.forEach(node => {
            graph.set(node.nodeId, []);
        });

        edges.forEach(edge => {
            const neighbors = graph.get(edge.sourceNodeId) || [];
            neighbors.push(edge.targetNodeId);
            graph.set(edge.sourceNodeId, neighbors);
        });

        const visited = new Set<string>();
        const recStack = new Set<string>();

        const dfs = (nodeId: string): boolean => {
            visited.add(nodeId);
            recStack.add(nodeId);

            const neighbors = graph.get(nodeId) || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    if (dfs(neighbor)) {
                        return true;
                    }
                } else if (recStack.has(neighbor)) {
                    return true;
                }
            }

            recStack.delete(nodeId);
            return false;
        };

        for (const nodeId of graph.keys()) {
            if (!visited.has(nodeId)) {
                if (dfs(nodeId)) {
                    return true;
                }
            }
        }

        return false;
    }
}
