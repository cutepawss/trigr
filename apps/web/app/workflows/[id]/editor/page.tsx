'use client';

import { useCallback, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactFlow, {
    Node,
    Edge,
    addEdge,
    Connection,
    Background,
    BackgroundVariant,
    Controls,
    useNodesState,
    useEdgesState,
    Handle,
    Position,
    NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useAuth } from '@/hooks/use-auth';
import { useWorkflow, useValidateWorkflow, useEstimateGas, useGenerateCode, useSimulateWorkflow, useDeployWorkflow } from '@/hooks/use-workflows';

/* 
 * COLOR PALETTE - ONLY THESE 5 COLORS:
 * #474448 - Primary Dark (headers, primary buttons)
 * #2d232e - Secondary Dark (darkest, accents)
 * #e0ddcf - Off-White (cards, panels)
 * #534b52 - Accent (borders, secondary text)
 * #f1f0ea - Neutral Light (backgrounds)
 */

// Custom nodes using ONLY palette colors
function TriggerNode({ data, selected }: NodeProps) {
    return (
        <div className={`px-4 py-3 rounded-lg min-w-[180px] bg-[#2d232e] ${selected ? 'ring-2 ring-[#534b52] shadow-lg' : ''}`}>
            <Handle type="target" position={Position.Top} className="!bg-[#534b52] !w-3 !h-3" />
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#474448] flex items-center justify-center text-[#e0ddcf] text-sm font-bold">
                    T
                </div>
                <div>
                    <div className="text-[10px] text-[#534b52] uppercase tracking-wider">Trigger</div>
                    <div className="text-sm font-medium text-[#f1f0ea]">{data.label}</div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-[#534b52] !w-3 !h-3" />
        </div>
    );
}

function ConditionNode({ data, selected }: NodeProps) {
    return (
        <div className={`px-4 py-3 rounded-lg min-w-[180px] bg-[#474448] ${selected ? 'ring-2 ring-[#534b52] shadow-lg' : ''}`}>
            <Handle type="target" position={Position.Top} className="!bg-[#534b52] !w-3 !h-3" />
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#2d232e] flex items-center justify-center text-[#e0ddcf] text-sm font-bold">
                    ?
                </div>
                <div>
                    <div className="text-[10px] text-[#e0ddcf]/60 uppercase tracking-wider">Condition</div>
                    <div className="text-sm font-medium text-[#f1f0ea]">{data.label}</div>
                </div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-[#e0ddcf]/80">
                <span>✓ Yes</span>
                <span>✗ No</span>
            </div>
            <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '30%' }} className="!bg-[#534b52] !w-3 !h-3" />
            <Handle type="source" position={Position.Bottom} id="no" style={{ left: '70%' }} className="!bg-[#534b52] !w-3 !h-3" />
        </div>
    );
}

function ActionNode({ data, selected }: NodeProps) {
    return (
        <div className={`px-4 py-3 rounded-lg min-w-[180px] bg-[#534b52] ${selected ? 'ring-2 ring-[#2d232e] shadow-lg' : ''}`}>
            <Handle type="target" position={Position.Top} className="!bg-[#474448] !w-3 !h-3" />
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#2d232e] flex items-center justify-center text-[#e0ddcf] text-sm font-bold">
                    →
                </div>
                <div>
                    <div className="text-[10px] text-[#e0ddcf]/60 uppercase tracking-wider">Action</div>
                    <div className="text-sm font-medium text-[#f1f0ea]">{data.label}</div>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="!bg-[#474448] !w-3 !h-3" />
        </div>
    );
}

const nodeTypes = { trigger: TriggerNode, condition: ConditionNode, action: ActionNode };

export default function WorkflowEditorPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { data: workflow, isLoading } = useWorkflow(params.id);

    const validateMutation = useValidateWorkflow(params.id);
    const estimateGasMutation = useEstimateGas(params.id);
    const generateCodeMutation = useGenerateCode(params.id);
    const simulateMutation = useSimulateWorkflow(params.id);
    const deployMutation = useDeployWorkflow(params.id);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [step, setStep] = useState(1); // Current step in the workflow

    // Results
    const [validationResult, setValidationResult] = useState<any>(null);
    const [gasEstimate, setGasEstimate] = useState<any>(null);
    const [generatedCode, setGeneratedCode] = useState<string>('');
    const [simulationResult, setSimulationResult] = useState<any>(null);

    useEffect(() => {
        if (workflow?.nodes && workflow?.edges) {
            const flowNodes = (workflow.nodes as any[]).map((node: any, i: number) => ({
                id: node.id,
                type: node.type,
                position: node.position || { x: 250, y: 80 + i * 120 },
                data: { label: node.data?.label || node.type, config: node.data?.config || {} },
            }));
            const flowEdges = (workflow.edges as any[]).map((edge: any) => ({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                sourceHandle: edge.sourceHandle,
                animated: true,
                style: { stroke: '#534b52', strokeWidth: 2 }
            }));
            setNodes(flowNodes);
            setEdges(flowEdges);
        }
    }, [workflow, setNodes, setEdges]);

    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    const onConnect = useCallback((conn: Connection) => {
        setEdges((eds) => addEdge({ ...conn, animated: true, style: { stroke: '#534b52', strokeWidth: 2 } }, eds));
    }, [setEdges]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const addNode = (type: 'trigger' | 'condition' | 'action') => {
        const labels = { trigger: 'New Trigger', condition: 'New Condition', action: 'New Action' };
        const newNode: Node = {
            id: `${type}_${Date.now()}`,
            type,
            position: { x: 250, y: 80 + nodes.length * 120 },
            data: { label: labels[type], config: {} }
        };
        setNodes((nds) => [...nds, newNode]);
        setSelectedNode(newNode);
    };

    const deleteNode = () => {
        if (!selectedNode) return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
    };

    const updateLabel = (label: string) => {
        if (!selectedNode) return;
        setNodes((nds) => nds.map((n) => n.id === selectedNode.id ? { ...n, data: { ...n.data, label } } : n));
        setSelectedNode({ ...selectedNode, data: { ...selectedNode.data, label } });
    };

    const handleValidate = async () => {
        try {
            const result = await validateMutation.mutateAsync();
            setValidationResult(result);
            if (result.isValid) setStep(2);
        } catch (e: any) {
            setValidationResult({ isValid: false, errors: [{ message: e.message }] });
        }
    };

    const handleEstimateGas = async () => {
        try {
            const result = await estimateGasMutation.mutateAsync();
            setGasEstimate(result);
        } catch (e: any) {
            setGasEstimate({ error: e.message });
        }
    };

    const handleGenerateCode = async () => {
        try {
            const result = await generateCodeMutation.mutateAsync();
            setGeneratedCode(result.code);
            setStep(3);
        } catch (e: any) {
            setGeneratedCode(`// Error: ${e.message}`);
        }
    };

    const handleSimulate = async () => {
        try {
            const result = await simulateMutation.mutateAsync({ balance: 1000 });
            setSimulationResult(result);
        } catch (e: any) {
            setSimulationResult({ success: false, error: e.message });
        }
    };

    const handleDeploy = async () => {
        try {
            await deployMutation.mutateAsync();
            setStep(4);
        } catch (e: any) {
            alert(`Deploy failed: ${e.message}`);
        }
    };

    const nodeTypesMemo = useMemo(() => nodeTypes, []);

    if (authLoading || isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#f1f0ea]">
                <div className="w-8 h-8 border-3 border-[#2d232e] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#f1f0ea]">
            {/* HEADER */}
            <header className="h-12 bg-[#2d232e] flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="text-[#f1f0ea] font-bold text-sm">Rialo</Link>
                    <span className="text-[#534b52]">›</span>
                    <span className="text-[#e0ddcf] text-sm">{workflow?.name || 'Workflow'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#534b52] uppercase tracking-wider mr-2">Step {step}/4</span>
                    <button
                        onClick={handleDeploy}
                        disabled={deployMutation.isPending || step < 3}
                        className="px-3 py-1.5 text-xs bg-[#474448] text-[#f1f0ea] rounded hover:bg-[#534b52] disabled:opacity-40 transition-colors"
                    >
                        {deployMutation.isPending ? 'Deploying...' : 'Deploy'}
                    </button>
                </div>
            </header>

            {/* MAIN */}
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT PANEL - Steps */}
                <div className="w-56 bg-[#e0ddcf] border-r border-[#534b52]/20 p-4 shrink-0 overflow-y-auto">
                    <h2 className="text-[10px] text-[#534b52] uppercase tracking-wider font-bold mb-4">
                        Build Automation
                    </h2>

                    {/* Step 1: Add Components */}
                    <div className={`mb-4 p-3 rounded-lg ${step >= 1 ? 'bg-[#f1f0ea]' : 'opacity-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 rounded-full bg-[#2d232e] text-[#f1f0ea] text-[10px] flex items-center justify-center font-bold">1</div>
                            <span className="text-xs font-medium text-[#2d232e]">Add Components</span>
                        </div>
                        <p className="text-[10px] text-[#534b52] mb-3">
                            Click below to add automation steps to the canvas.
                        </p>
                        <div className="space-y-1.5">
                            <button onClick={() => addNode('trigger')} className="w-full text-left px-2 py-1.5 text-xs bg-[#2d232e] text-[#f1f0ea] rounded hover:bg-[#474448]">
                                + Trigger (when to run)
                            </button>
                            <button onClick={() => addNode('condition')} className="w-full text-left px-2 py-1.5 text-xs bg-[#474448] text-[#f1f0ea] rounded hover:bg-[#534b52]">
                                + Condition (if/then)
                            </button>
                            <button onClick={() => addNode('action')} className="w-full text-left px-2 py-1.5 text-xs bg-[#534b52] text-[#f1f0ea] rounded hover:bg-[#474448]">
                                + Action (what to do)
                            </button>
                        </div>
                    </div>

                    {/* Step 2: Validate */}
                    <div className={`mb-4 p-3 rounded-lg ${step >= 1 ? 'bg-[#f1f0ea]' : 'opacity-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-5 h-5 rounded-full ${step >= 2 ? 'bg-[#2d232e]' : 'bg-[#534b52]'} text-[#f1f0ea] text-[10px] flex items-center justify-center font-bold`}>2</div>
                            <span className="text-xs font-medium text-[#2d232e]">Validate</span>
                        </div>
                        <p className="text-[10px] text-[#534b52] mb-2">
                            Check if your workflow is valid.
                        </p>
                        <button
                            onClick={handleValidate}
                            disabled={validateMutation.isPending || nodes.length === 0}
                            className="w-full px-2 py-1.5 text-xs bg-[#2d232e] text-[#f1f0ea] rounded hover:bg-[#474448] disabled:opacity-40"
                        >
                            {validateMutation.isPending ? 'Checking...' : 'Validate Workflow'}
                        </button>
                        {validationResult && (
                            <div className={`mt-2 p-2 rounded text-[10px] ${validationResult.isValid ? 'bg-[#2d232e] text-[#e0ddcf]' : 'bg-[#534b52] text-[#f1f0ea]'}`}>
                                {validationResult.isValid ? '✓ Valid' : `✗ ${validationResult.errors?.[0]?.message || 'Invalid'}`}
                            </div>
                        )}
                    </div>

                    {/* Step 3: Test */}
                    <div className={`mb-4 p-3 rounded-lg ${step >= 2 ? 'bg-[#f1f0ea]' : 'opacity-50 pointer-events-none'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-5 h-5 rounded-full ${step >= 3 ? 'bg-[#2d232e]' : 'bg-[#534b52]'} text-[#f1f0ea] text-[10px] flex items-center justify-center font-bold`}>3</div>
                            <span className="text-xs font-medium text-[#2d232e]">Test & Preview</span>
                        </div>
                        <div className="space-y-1.5">
                            <button
                                onClick={handleEstimateGas}
                                disabled={estimateGasMutation.isPending}
                                className="w-full px-2 py-1.5 text-xs bg-[#474448] text-[#f1f0ea] rounded hover:bg-[#534b52] disabled:opacity-40"
                            >
                                {estimateGasMutation.isPending ? '...' : 'Estimate Gas'}
                            </button>
                            <button
                                onClick={handleSimulate}
                                disabled={simulateMutation.isPending}
                                className="w-full px-2 py-1.5 text-xs bg-[#474448] text-[#f1f0ea] rounded hover:bg-[#534b52] disabled:opacity-40"
                            >
                                {simulateMutation.isPending ? '...' : 'Simulate'}
                            </button>
                            <button
                                onClick={handleGenerateCode}
                                disabled={generateCodeMutation.isPending}
                                className="w-full px-2 py-1.5 text-xs bg-[#474448] text-[#f1f0ea] rounded hover:bg-[#534b52] disabled:opacity-40"
                            >
                                {generateCodeMutation.isPending ? '...' : 'Generate Code'}
                            </button>
                        </div>
                        {gasEstimate && !gasEstimate.error && (
                            <div className="mt-2 p-2 rounded bg-[#2d232e] text-[10px] text-[#e0ddcf]">
                                Gas: {gasEstimate.total || gasEstimate.totalGas}
                            </div>
                        )}
                    </div>

                    {/* Step 4: Deploy */}
                    <div className={`p-3 rounded-lg ${step >= 3 ? 'bg-[#f1f0ea]' : 'opacity-50 pointer-events-none'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-5 h-5 rounded-full ${step >= 4 ? 'bg-[#2d232e]' : 'bg-[#534b52]'} text-[#f1f0ea] text-[10px] flex items-center justify-center font-bold`}>4</div>
                            <span className="text-xs font-medium text-[#2d232e]">Deploy</span>
                        </div>
                        <p className="text-[10px] text-[#534b52] mb-2">
                            Deploy to Rialo Network.
                        </p>
                        <button
                            onClick={handleDeploy}
                            disabled={deployMutation.isPending}
                            className="w-full px-2 py-1.5 text-xs bg-[#2d232e] text-[#f1f0ea] rounded hover:bg-[#474448] disabled:opacity-40"
                        >
                            {deployMutation.isPending ? 'Deploying...' : step >= 4 ? '✓ Deployed' : 'Deploy Workflow'}
                        </button>
                    </div>
                </div>

                {/* CENTER - Canvas */}
                <div className="flex-1 relative">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypesMemo}
                        fitView
                        className="bg-[#f1f0ea]"
                    >
                        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#534b52" />
                        <Controls className="!bg-[#e0ddcf] !border-[#534b52]/30 !rounded-lg [&>button]:!bg-[#e0ddcf] [&>button]:!border-[#534b52]/30 [&>button]:!text-[#2d232e]" />
                    </ReactFlow>

                    {/* Empty state */}
                    {nodes.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-[#e0ddcf] rounded-lg p-6 text-center max-w-xs border border-[#534b52]/20">
                                <div className="text-2xl mb-2">↙</div>
                                <h3 className="text-sm font-bold text-[#2d232e] mb-1">Start Here</h3>
                                <p className="text-[11px] text-[#534b52]">
                                    Click the buttons on the left panel to add your first automation component.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT - Node Properties */}
                <div className="w-64 bg-[#e0ddcf] border-l border-[#534b52]/20 p-4 shrink-0 overflow-y-auto">
                    <h2 className="text-[10px] text-[#534b52] uppercase tracking-wider font-bold mb-4">
                        Properties
                    </h2>

                    {selectedNode ? (
                        <div className="space-y-4">
                            <div className="bg-[#f1f0ea] rounded-lg p-3">
                                <label className="block text-[10px] text-[#534b52] uppercase tracking-wider mb-1">Type</label>
                                <div className="text-sm text-[#2d232e] font-medium capitalize">{selectedNode.type}</div>
                            </div>

                            <div className="bg-[#f1f0ea] rounded-lg p-3">
                                <label className="block text-[10px] text-[#534b52] uppercase tracking-wider mb-1">Name</label>
                                <input
                                    type="text"
                                    value={selectedNode.data.label}
                                    onChange={(e) => updateLabel(e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm bg-white border border-[#534b52]/30 rounded text-[#2d232e]"
                                />
                            </div>

                            <button
                                onClick={deleteNode}
                                className="w-full px-3 py-2 text-xs border border-[#534b52]/30 text-[#534b52] rounded hover:bg-[#f1f0ea]"
                            >
                                Delete Node
                            </button>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-xs text-[#534b52]">Click a node on the canvas to edit its properties.</p>
                        </div>
                    )}

                    {/* Code Preview */}
                    {generatedCode && (
                        <div className="mt-4">
                            <h3 className="text-[10px] text-[#534b52] uppercase tracking-wider font-bold mb-2">Generated Code</h3>
                            <pre className="bg-[#2d232e] text-[#e0ddcf] rounded-lg p-3 text-[10px] overflow-auto max-h-40 font-mono">
                                {generatedCode}
                            </pre>
                        </div>
                    )}

                    {/* Simulation Result */}
                    {simulationResult && (
                        <div className="mt-4">
                            <h3 className="text-[10px] text-[#534b52] uppercase tracking-wider font-bold mb-2">Simulation</h3>
                            <div className={`p-3 rounded-lg text-xs ${simulationResult.success ? 'bg-[#2d232e] text-[#e0ddcf]' : 'bg-[#534b52] text-[#f1f0ea]'}`}>
                                {simulationResult.success ? '✓ Success' : `✗ ${simulationResult.error || 'Failed'}`}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
