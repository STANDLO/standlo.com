import React, { useCallback, useMemo, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Node as RFNode, getIncomers, Edge } from '@xyflow/react';
import { CollectionSchemaRegistry, extractFieldsFromZod, AvailableEntities, AvailableCollections } from '../utils/schemaRegistry';
import { OrchestratorClient } from '../../lib/orchestratorClient';
import { PipelineEntity } from '@standlo/functions/src/schemas/pipeline';

interface Props {
    selectedNode: RFNode | null;
    setNodes: React.Dispatch<React.SetStateAction<RFNode[]>>;
    pipelineId: string;
    nodes: RFNode[];
    edges: Edge[];
}interface NodeData {
    actionType?: string;
    targetPath?: string;
    condition?: string;
    queryField?: string;
    queryOperator?: string;
    queryValue?: string;
    payload?: string;
    skillId?: string;
    [key: string]: string | undefined;
}

export default function PropertiesSidebar({ selectedNode, setNodes, pipelineId, nodes, edges }: Props) {
    const data = useMemo(() => (selectedNode?.data || {}) as NodeData, [selectedNode?.data]);
    const type = selectedNode?.type;

    const [payloadMode, setPayloadMode] = useState<'visual' | 'raw'>('visual');
    const [aiSkills, setAiSkills] = useState<{ skillId?: string; displayName?: string; description?: string; inputSchemaJson?: string }[]>([]);
    const [pipelines, setPipelines] = useState<PipelineEntity[]>([]);

    React.useEffect(() => {
        if (selectedNode?.type === 'brain' && aiSkills.length === 0) {
            OrchestratorClient.list("ai_skill").then(data => setAiSkills((data as { skillId?: string; displayName?: string; description?: string; inputSchemaJson?: string }[]) || [])).catch(console.error);
        }
    }, [selectedNode?.type, aiSkills.length]);

    React.useEffect(() => {
        if (selectedNode?.type === 'action' && data.actionType === 'run_pipeline' && pipelines.length === 0) {
            OrchestratorClient.list<PipelineEntity>("pipeline", { limit: 100 }).then(res => setPipelines(res || [])).catch(console.error);
        }
    }, [selectedNode?.type, data.actionType, pipelines.length]);

    const updateNodeData = useCallback((key: string, value: unknown) => {
        if (!selectedNode) return;

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    return {
                        ...node,
                        data: {
                            ...node.data,
                            [key]: value
                        }
                    };
                }
                return node;
            })
        );
    }, [selectedNode, setNodes]);

    const upstreamSchemaFields = useMemo(() => {
        if (!selectedNode || (selectedNode.type !== 'logic' && selectedNode.type !== 'action') || !nodes || !edges) return null;

        // Find all incomers to this node backwards
        let currentNodes = [selectedNode];
        let foundTrigger: RFNode | null = null;

        // Traverse backwards up to 10 levels to prevent infinite loops, looking for a trigger
        for (let i = 0; i < 10; i++) {
            const nextIncomers = currentNodes.flatMap(node => getIncomers(node, nodes, edges));
            if (nextIncomers.length === 0) break;

            const trigger = nextIncomers.find(n => n.type === 'trigger');
            if (trigger) {
                foundTrigger = trigger;
                break;
            }
            currentNodes = nextIncomers;
        }

        if (foundTrigger && foundTrigger.data?.triggerType === 'firestore_event' && foundTrigger.data?.collection) {
            const collectionName = String(foundTrigger.data.collection);
            const schema = CollectionSchemaRegistry[collectionName];
            if (schema) {
                return {
                    triggerId: foundTrigger.id,
                    collectionName: collectionName,
                    fields: extractFieldsFromZod(schema)
                };
            }
        }
        return null;
    }, [selectedNode, nodes, edges]);

    // Phase 8: Infer Action Target schema
    const actionSchemaFields = useMemo(() => {
        if (selectedNode?.type !== 'action' || !data.targetPath) return null;
        if (typeof data.actionType !== 'string' || !data.actionType.startsWith('orchestrator_')) return null;

        // TargetPath might be "mesh" or "projects/{{id}}/stands/{{id}}/mesh"
        const targetPath = typeof data.targetPath === 'string' ? data.targetPath : '';
        const segments = targetPath.split('/');
        const lastSegment = segments.pop()?.toLowerCase() || '';

        const schema = CollectionSchemaRegistry[lastSegment];
        if (!schema) return null;

        return {
            entityName: lastSegment,
            fields: extractFieldsFromZod(schema)
        };
    }, [selectedNode, data]);

    // Infer AI target schema
    const aiSchemaFields = useMemo(() => {
        if (selectedNode?.type !== 'brain' || !data.skillId) return null;

        const skill = aiSkills.find(s => s.skillId === data.skillId);
        if (!skill) return null;

        try {
            const parsedJsonSchema = JSON.parse(String(skill.inputSchemaJson));
            const fields = Object.entries(parsedJsonSchema.properties || {}).map(([key, prop]) => {
                const p = prop as { type?: string; enum?: string[] };
                return {
                    name: key,
                    type: p.type || 'string',
                    options: p.enum,
                    _def: {}
                };
            });
            return {
                entityName: skill.displayName,
                fields
            };
        } catch (e) {
            console.error("Failed to parse AI skill schema", e);
            return null;
        }
    }, [selectedNode, data.skillId, aiSkills]);

    // Used for visual action logic editing
    const handleVisualPayloadChange = (fieldName: string, value: string) => {
        let currentPayloadObj: Record<string, unknown> = {};
        try {
            if (data.payload) currentPayloadObj = JSON.parse(String(data.payload));
        } catch {
            // Ignore parse errors, start fresh if invalid
        }

        const newPayload = { ...currentPayloadObj, [fieldName]: value };

        // Remove empty strings or undefined to keep payload clean
        if (value === '' || value === undefined) {
            delete newPayload[fieldName];
        }

        updateNodeData('payload', JSON.stringify(newPayload, null, 2));
    };

    if (!selectedNode) {
        return (
            <div className="w-80 border-l border-[#e3e8ee] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shrink-0 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 text-zinc-800 dark:text-zinc-200">
                    <Settings2 className="w-5 h-5" />
                    <h3 className="text-sm font-semibold uppercase tracking-widest">Properties</h3>
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 italic">Select a node to configure it</div>
            </div>
        );
    }

    return (
        <div className="w-80 border-l border-[#e3e8ee] dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shrink-0 overflow-y-auto">
            <div className="flex items-center gap-2 mb-6 text-zinc-800 dark:text-zinc-200 border-b border-[#e3e8ee] dark:border-zinc-800 pb-4">
                <Settings2 className="w-5 h-5" />
                <h3 className="text-sm font-semibold uppercase tracking-widest">Properties</h3>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Type</label>
                    <div className="text-sm font-medium px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded text-zinc-800 dark:text-zinc-200">
                        {type}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Label</label>
                    <input
                        type="text"
                        value={data.label || ''}
                        onChange={(e) => updateNodeData('label', e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-sm px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                {/* Dynamic fields based on Node Type */}
                {type === 'trigger' && (
                    <>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Trigger Type</label>
                            <select
                                value={data.triggerType || ''}
                                onChange={(e) => updateNodeData('triggerType', e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-sm px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Select...</option>
                                <option value="schedule">Schedule (Cron)</option>
                                <option value="webhook">Webhook (HTTP)</option>
                                <option value="firestore_event">Firestore Event</option>
                            </select>
                        </div>
                        {data.triggerType === 'webhook' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Webhook URL</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            value={process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ? `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/webhooks?id=${pipelineId}` : `https://europe-west4-standlo-com.cloudfunctions.net/webhooks?id=${pipelineId}`}
                                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-[#e3e8ee] dark:border-zinc-700 rounded text-xs px-2 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none pr-8 truncate selection:bg-indigo-200"
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const url = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL ? `${process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL}/webhooks?id=${pipelineId}` : `https://europe-west4-standlo-com.cloudfunctions.net/webhooks?id=${pipelineId}`;
                                                navigator.clipboard.writeText(url);
                                                // Optional UI feedback could be added here
                                            }}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-indigo-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded cursor-pointer"
                                            title="Copy to clipboard"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Secret Token (Optional)</label>
                                    <input
                                        type="text"
                                        value={data.webhookSecret || ''}
                                        onChange={(e) => updateNodeData('webhookSecret', e.target.value)}
                                        className="w-full bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-sm px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        placeholder="Require ?token=SECRET"
                                    />
                                    <p className="text-[10px] text-zinc-500 mt-1">If set, external callers must provide this secret.</p>
                                </div>
                            </div>
                        )}
                        {data.triggerType === 'firestore_event' && (
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Collection Name</label>
                                <select
                                    value={data.collection || ''}
                                    onChange={(e) => updateNodeData('collection', e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-sm px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Select Collection...</option>
                                    {AvailableCollections.map(col => (
                                        <option key={col.id} value={col.id}>{col.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {data.triggerType === 'schedule' && (
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Cron Expression</label>
                                <input
                                    type="text"
                                    value={data.cron || ''}
                                    onChange={(e) => updateNodeData('cron', e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-sm px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    placeholder="0 0 * * *"
                                />
                            </div>
                        )}
                    </>
                )}

                {type === 'action' && (
                    <>
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Action Engine</label>
                            <select
                                value={data.actionType || ''}
                                onChange={(e) => updateNodeData('actionType', e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-sm px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Select...</option>
                                <option value="orchestrator_create">Orchestrator: Create Entity</option>
                                <option value="orchestrator_update">Orchestrator: Update Entity</option>
                                <option value="orchestrator_delete">Orchestrator: Delete Entity</option>
                                <option value="run_pipeline">Run Pipeline</option>
                                <option value="http_request">External HTTP Request</option>
                            </select>
                        </div>

                        {data.actionType?.startsWith('orchestrator_') && (
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                                    Target Entity Schema
                                </label>
                                <select
                                    value={data.targetPath || ''}
                                    onChange={(e) => updateNodeData('targetPath', e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-sm px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                    <option value="">Select Entity...</option>
                                    {AvailableEntities.map(entity => (
                                        <option key={entity.id} value={entity.id}>{entity.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {data.actionType === 'run_pipeline' && (
                            <div>
                                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                                    Target Pipeline ID
                                </label>
                                <select
                                    value={data.targetPath || ''}
                                    onChange={(e) => updateNodeData('targetPath', e.target.value)}
                                    className="w-full bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-sm px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                                >
                                    <option value="">Select Pipeline...</option>
                                    {pipelines.map(p => (
                                        <option key={p.id} value={p.id}>{p.name || p.id}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-zinc-500 mt-1">Supports {'{{ handlebar }}'} injection</p>
                            </div>
                        )}
                        {((data.actionType?.startsWith('orchestrator_') && (data.actionType.includes("create") || data.actionType.includes("update"))) || data.actionType === 'run_pipeline') && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Payload</label>
                                    <div className="flex gap-2">
                                        {upstreamSchemaFields && payloadMode === 'visual' && (
                                            <button
                                                onClick={() => {
                                                    const newPayload: Record<string, unknown> = {};
                                                    // Parse existing to safely merge
                                                    try {
                                                        if (data.payload) Object.assign(newPayload, JSON.parse(String(data.payload)));
                                                    } catch { }

                                                    actionSchemaFields?.fields.forEach(f => {
                                                        if (upstreamSchemaFields.fields.some(uf => uf.name === f.name)) {
                                                            newPayload[f.name] = `{{ nodes.${upstreamSchemaFields.triggerId}.payload.${f.name} }}`;
                                                        }
                                                    });
                                                    updateNodeData('payload', JSON.stringify(newPayload, null, 2));
                                                }}
                                                className="text-[10px] px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                                title={`Auto-map fields from ${upstreamSchemaFields.collectionName}`}
                                            >
                                                Auto-Map
                                            </button>
                                        )}
                                        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded p-0.5">
                                            <button
                                                onClick={() => setPayloadMode('visual')}
                                                className={`text-[10px] px-2 py-1 rounded transition-colors ${payloadMode === 'visual' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                                disabled={!actionSchemaFields}
                                                title={!actionSchemaFields ? "Enter a recognized target schema to use Visual Builder" : ""}
                                            >
                                                Visual
                                            </button>
                                            <button
                                                onClick={() => setPayloadMode('raw')}
                                                className={`text-[10px] px-2 py-1 rounded transition-colors ${payloadMode === 'raw' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                            >
                                                Raw JSON
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {payloadMode === 'visual' && actionSchemaFields ? (
                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded p-3 space-y-3">
                                        {actionSchemaFields.fields.map(f => {
                                            let currentVal = '';
                                            try {
                                                if (data.payload) currentVal = JSON.parse(data.payload)[f.name] || '';
                                            } catch { }

                                            return (
                                                <div key={f.name}>
                                                    <label className="block text-[10px] font-medium text-indigo-700 dark:text-indigo-300 mb-1 flex justify-between">
                                                        <span>{f.name}</span>
                                                        <span className="text-[9px] text-zinc-400 font-mono">{f.type}</span>
                                                    </label>
                                                    {f.options ? (
                                                        <select
                                                            value={currentVal}
                                                            onChange={(e) => handleVisualPayloadChange(f.name, e.target.value)}
                                                            className="w-full bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800/50 rounded text-xs px-2 py-1.5 focus:outline-none focus:border-indigo-400"
                                                        >
                                                            <option value="">(Inherit / Default)</option>
                                                            {f.options.map(opt => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input
                                                            type="text"
                                                            value={currentVal}
                                                            onChange={(e) => handleVisualPayloadChange(f.name, e.target.value)}
                                                            placeholder={upstreamSchemaFields && upstreamSchemaFields.fields.some(uf => uf.name === f.name) ? `{{ nodes.${upstreamSchemaFields.triggerId}.payload.${f.name} }}` : (f.type === 'ZodNumber' ? '0' : '{{ ... }}')}
                                                            className="w-full bg-white dark:bg-zinc-900 border border-indigo-200 dark:border-indigo-800/50 rounded text-xs px-2 py-1.5 focus:outline-none focus:border-indigo-400"
                                                        />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <textarea
                                        value={data.payload || ''}
                                        onChange={(e) => updateNodeData('payload', e.target.value)}
                                        className="w-full bg-slate-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-sm px-3 py-2 text-green-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs min-h-[120px]"
                                        placeholder={'{\n  "status": "{{ nodes.logic_1.status }}"\n}'}
                                    />
                                )}
                            </div>
                        )}
                    </>
                )}

                {type === 'logic' && (
                    <div className="space-y-4">
                        {upstreamSchemaFields ? (
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded p-3">
                                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                                    Type-Aware Builder ({upstreamSchemaFields.collectionName})
                                </div>
                                <div className="space-y-2">
                                    <div>
                                        <select
                                            value={data.queryField || ''}
                                            onChange={(e) => {
                                                const field = e.target.value;
                                                updateNodeData('queryField', field);
                                                // Auto-compile condition
                                                if (field && data.queryOperator && data.queryValue !== undefined && data.queryValue !== '') {
                                                    const valStr = isNaN(Number(data.queryValue)) ? `"${data.queryValue}"` : data.queryValue;
                                                    updateNodeData('condition', `{{ nodes.${upstreamSchemaFields.triggerId}.output.data.${field} }} ${data.queryOperator} ${valStr}`);
                                                }
                                            }}
                                            className="w-full bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-xs px-2 py-1.5 focus:outline-none"
                                        >
                                            <option value="">Select Field...</option>
                                            {upstreamSchemaFields.fields.map(f => (
                                                <option key={f.name} value={f.name}>{f.name} ({f.type})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <select
                                            value={data.queryOperator || ''}
                                            onChange={(e) => {
                                                const op = e.target.value;
                                                updateNodeData('queryOperator', op);
                                                if (data.queryField && op && data.queryValue !== undefined && data.queryValue !== '') {
                                                    const valStr = isNaN(Number(data.queryValue)) ? `"${data.queryValue}"` : data.queryValue;
                                                    updateNodeData('condition', `{{ nodes.${upstreamSchemaFields.triggerId}.output.data.${data.queryField} }} ${op} ${valStr}`);
                                                }
                                            }}
                                            className="w-1/3 bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-xs px-2 py-1.5 focus:outline-none"
                                        >
                                            <option value="">Op</option>
                                            <option value="===">==</option>
                                            <option value="!==">!=</option>
                                            <option value=">">&gt;</option>
                                            <option value="<">&lt;</option>
                                            <option value=">=">&gt;=</option>
                                            <option value="<=">&lt;=</option>
                                        </select>
                                        {(() => {
                                            const selectedFieldSchema = upstreamSchemaFields.fields.find(f => f.name === data.queryField);

                                            if (selectedFieldSchema?.options) {
                                                return (
                                                    <select
                                                        value={data.queryValue || ''}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            updateNodeData('queryValue', val);
                                                            if (data.queryField && data.queryOperator && val !== '') {
                                                                updateNodeData('condition', `{{ nodes.${upstreamSchemaFields.triggerId}.output.data.${data.queryField} }} ${data.queryOperator} "${val}"`);
                                                            }
                                                        }}
                                                        className="w-2/3 bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-xs px-2 py-1.5 focus:outline-none"
                                                    >
                                                        <option value="">Select option...</option>
                                                        {selectedFieldSchema.options.map((opt: string) => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                );
                                            }

                                            return (
                                                <input
                                                    type="text"
                                                    value={data.queryValue || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        updateNodeData('queryValue', val);
                                                        if (data.queryField && data.queryOperator && val !== '') {
                                                            const valStr = isNaN(Number(val)) ? `"${val}"` : val;
                                                            updateNodeData('condition', `{{ nodes.${upstreamSchemaFields.triggerId}.output.data.${data.queryField} }} ${data.queryOperator} ${valStr}`);
                                                        }
                                                    }}
                                                    placeholder="Value..."
                                                    className="w-2/3 bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-xs px-2 py-1.5 focus:outline-none"
                                                />
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-[10px] text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                                Connect to a Firestore Trigger to enable Type-Aware Builder.
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Generated Condition</label>
                            <input
                                type="text"
                                value={data.condition || ''}
                                onChange={(e) => updateNodeData('condition', e.target.value)}
                                className="w-full bg-slate-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-sm px-3 py-2 text-yellow-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
                                placeholder="{{ nodes.trigger_1.payload.amount }} > 1000"
                            />
                        </div>
                    </div>
                )}

                {type === 'brain' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                                AI Skill
                            </label>
                            <select
                                value={data.skillId || ''}
                                onChange={(e) => updateNodeData('skillId', e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-sm px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="">Select AI Skill...</option>
                                {aiSkills.map((skill) => (
                                    <option key={skill.skillId} value={skill.skillId}>{skill.displayName}</option>
                                ))}
                            </select>
                            {data.skillId && aiSkills.find(s => s.skillId === data.skillId) && (
                                <p className="text-[10px] text-zinc-500 mt-1">{aiSkills.find(s => s.skillId === data.skillId)?.description}</p>
                            )}
                        </div>

                        {data.skillId && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Input Prompt Payload</label>
                                    <div className="flex gap-2">
                                        {upstreamSchemaFields && payloadMode === 'visual' && (
                                            <button
                                                onClick={() => {
                                                    const newPayload: Record<string, unknown> = {};
                                                    try {
                                                        if (data.payload) Object.assign(newPayload, JSON.parse(String(data.payload)));
                                                    } catch { }

                                                    aiSchemaFields?.fields.forEach(f => {
                                                        if (upstreamSchemaFields.fields.some(uf => uf.name === f.name)) {
                                                            newPayload[f.name] = `{{ nodes.${upstreamSchemaFields.triggerId}.payload.${f.name} }}`;
                                                        }
                                                    });
                                                    updateNodeData('payload', JSON.stringify(newPayload, null, 2));
                                                }}
                                                className="text-[10px] px-2 py-1 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                                title={`Auto-map fields from ${upstreamSchemaFields.collectionName}`}
                                            >
                                                Auto-Map
                                            </button>
                                        )}
                                        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded p-0.5">
                                            <button
                                                onClick={() => setPayloadMode('visual')}
                                                className={`text-[10px] px-2 py-1 rounded transition-colors ${payloadMode === 'visual' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                            >
                                                Visual
                                            </button>
                                            <button
                                                onClick={() => setPayloadMode('raw')}
                                                className={`text-[10px] px-2 py-1 rounded transition-colors ${payloadMode === 'raw' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                            >
                                                Raw JSON
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {payloadMode === 'visual' && aiSchemaFields ? (
                                    <div className="bg-fuchsia-50/50 dark:bg-fuchsia-900/10 border border-fuchsia-100 dark:border-fuchsia-800/30 rounded p-3 space-y-3">
                                        {aiSchemaFields.fields.map(f => {
                                            let currentVal = '';
                                            try {
                                                if (data.payload) currentVal = JSON.parse(data.payload)[f.name] || '';
                                            } catch { }

                                            return (
                                                <div key={f.name}>
                                                    <label className="block text-[10px] font-medium text-fuchsia-700 dark:text-fuchsia-300 mb-1 flex justify-between">
                                                        <span>{f.name}</span>
                                                        <span className="text-[9px] text-zinc-400 font-mono">{f.type}</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={currentVal}
                                                        onChange={(e) => handleVisualPayloadChange(f.name, e.target.value)}
                                                        placeholder={upstreamSchemaFields && upstreamSchemaFields.fields.some(uf => uf.name === f.name) ? `{{ nodes.${upstreamSchemaFields.triggerId}.payload.${f.name} }}` : '{{ ... }}'}
                                                        className="w-full bg-white dark:bg-zinc-900 border border-fuchsia-200 dark:border-fuchsia-800/50 rounded text-xs px-2 py-1.5 focus:outline-none focus:border-fuchsia-400"
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <textarea
                                        value={data.payload || ''}
                                        onChange={(e) => updateNodeData('payload', e.target.value)}
                                        className="w-full bg-slate-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-sm px-3 py-2 text-green-400 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 font-mono text-xs min-h-[120px]"
                                        placeholder={'{\n  "description": "{{ nodes.trigger_1.payload.text }}"\n}'}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
