"use client";

import React, { useState, useCallback } from 'react';
import { ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge, NodeChange, EdgeChange, Connection, Edge as RFEdge, Node as RFNode, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, X } from 'lucide-react';
import { PipelineEntity } from '@standlo/functions/src/schemas/pipeline';
import { OrchestratorClient } from '../../lib/orchestratorClient';
import NodesSidebar from './NodesSidebar';
import PropertiesSidebar from './PropertiesSidebar';
import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import LogicNode from './nodes/LogicNode';
import BrainNode from './nodes/BrainNode';

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    logic: LogicNode,
    brain: BrainNode,
};

function generateId() {
    return `node_${Math.random().toString(36).substr(2, 9)}`;
}

interface FlowAreaProps {
    nodes: RFNode[];
    edges: RFEdge[];
    setNodes: React.Dispatch<React.SetStateAction<RFNode[]>>;
    setEdges: React.Dispatch<React.SetStateAction<RFEdge[]>>;
    onNodesChange: (changes: NodeChange[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection | RFEdge) => void;
}

const FlowArea = ({ nodes, edges, setNodes, onNodesChange, onEdgesChange, onConnect }: FlowAreaProps) => {
    const { screenToFlowPosition } = useReactFlow();

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Map custom generic names to specific data structures
            const defaultData = { label: `${type.toUpperCase()}` };

            const newNode: RFNode = {
                id: generateId(),
                type, // This tells React Flow which custom node component to use
                position,
                data: defaultData,
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes]
    );

    return (
        <div className="flex-1 relative" onDragOver={onDragOver} onDrop={onDrop}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            >
                <Background />
                <Controls />
            </ReactFlow>
        </div>
    );
};

interface Props {
    pipeline: PipelineEntity;
    onClose: () => void;
}

export default function PipelineCanvasEditor({ pipeline, onClose }: Props) {
    const [nodes, setNodes] = useState<RFNode[]>(
        (pipeline.nodes as unknown as RFNode[]) || []
    );
    const [edges, setEdges] = useState<RFEdge[]>(
        (pipeline.edges as unknown as RFEdge[]) || []
    );
    const [saving, setSaving] = useState(false);

    // Convert entity properties to local state to allow renaming or activating
    const [name, setName] = useState(pipeline.name || "New Pipeline");
    const [isActive, setIsActive] = useState(pipeline.isActive || false);

    // React Flow manages node.selected boolean state automatically when users click
    const selectedNode = nodes.find(n => n.selected) || null;

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    const onConnect = useCallback(
        (params: Connection | RFEdge) => setEdges((eds) => addEdge(params, eds)),
        []
    );

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...pipeline,
                name,
                isActive,
                nodes,
                edges
            };

            if (pipeline.id) {
                await OrchestratorClient.update("pipeline", payload);
            } else {
                await OrchestratorClient.create("pipeline", payload);
            }
            onClose();
        } catch (e) {
            console.error(e);
            alert("Error saving pipeline. Check console.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#f7f9fc] dark:bg-[#0e0e11]">
            <header className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-[#e3e8ee] dark:border-zinc-800 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <div>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-lg font-bold bg-transparent border-none outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                        />
                        <p className="text-xs text-zinc-500 font-mono px-1">ID: {pipeline.id || "Unsaved"}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Active</span>
                        <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => setIsActive(e.target.checked)}
                            className="form-checkbox h-4 w-4 text-green-500 rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                    </label>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium disabled:opacity-50 transition-colors"
                    >
                        {saving ? <span className="animate-spin w-4 h-4 rounded-full border-2 border-white/30 border-t-white" /> : <Save className="w-4 h-4" />}
                        {saving ? "Deploying..." : "Save & Deploy"}
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <NodesSidebar />

                <ReactFlowProvider>
                    <FlowArea
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                    />
                </ReactFlowProvider>

                <PropertiesSidebar selectedNode={selectedNode} setNodes={setNodes} pipelineId={pipeline.id!} nodes={nodes} edges={edges} />
            </div>
        </div>
    );
}
