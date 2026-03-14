"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Activity, Play, X, CloudUpload, Loader2 } from "lucide-react";
import { OrchestratorClient } from "../lib/orchestratorClient";
import PipelineCanvasEditor from "./components/PipelineCanvasEditor";
import { PipelineEntity } from "@standlo/functions/src/schemas/pipeline";

export default function PipelinesAdminPage() {
    const [pipelines, setPipelines] = useState<PipelineEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<PipelineEntity | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await OrchestratorClient.list<PipelineEntity>("pipeline", { limit: 100 });
            setPipelines(data || []);
        } catch (e) {
            console.error("Failed to load data", e);
            alert("Error loading pipelines");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openEditor = (item: PipelineEntity | null) => {
        if (item) {
            setEditing(item);
        } else {
            // Defaults for new Pipeline
            setEditing({
                name: "New Pipeline",
                description: "",
                nodes: [],
                edges: [],
                isActive: false,
                code: "temp",
                version: 1,
                isArchived: false
            } as PipelineEntity);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this Pipeline? This action is irreversible.")) return;
        try {
            await OrchestratorClient.delete("pipeline", id);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Error deleting pipeline");
        }
    };

    const handleSeedData = async () => {
        if (!confirm("Warning: This will reload the local static seed for Pipelines into Firestore, overwriting existing matching documents. Proceed?")) return;
        setLoading(true);
        try {
            const res = await fetch('/api/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target: 'pipelines' })
            });
            const data = await res.json();
            if (data.success) {
                alert("Pipelines Seeded Successfully!");
                loadData();
            } else {
                alert("Failed to seed Pipelines: " + data.error);
                setLoading(false);
            }
        } catch (error) {
            console.error("Failed to execute seed", error);
            alert("Execution failed.");
            setLoading(false);
        }
    };

    const [isSyncing, setIsSyncing] = useState<string | null>(null);

    const handleSyncToCloud = async (id: string) => {
        if (!confirm("Overwrite this pipeline in the Production Cloud? This is irreversible.")) return;
        setIsSyncing(id);
        try {
            const res = await fetch('/api/sync-doc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionName: 'pipelines', documentId: id })
            });
            const data = await res.json();
            if (data.success) {
                alert("Successfully synced to Production Cloud!");
            } else {
                console.error(data.log);
                alert("Sync failed. Check console.");
            }
        } catch (e) {
            console.error(e);
            alert("Sync request failed.");
        } finally {
            setIsSyncing(null);
        }
    };

    const [dryRunResult, setDryRunResult] = useState<{ pipelineName: string; result: Record<string, unknown> } | null>(null);

    const handleDryRun = async (pipeline: PipelineEntity) => {
        if (!pipeline.id) return;
        try {
            const response = await OrchestratorClient.call({
                entityId: "pipeline",
                actionId: "run_pipeline_test",
                payload: { id: pipeline.id, context: { testFlag: true } }
            });
            setDryRunResult({ pipelineName: pipeline.name || 'Unnamed', result: response as unknown as Record<string, unknown> });
        } catch (e) {
            console.error("Pipeline run failed:", e);
            alert("Pipeline run failed. Check console.");
        }
    };

    // If an item is being edited, render the full-screen Canvas instead of the list
    if (editing) {
        return (
            <PipelineCanvasEditor
                pipeline={editing}
                onClose={() => {
                    setEditing(null);
                    loadData();
                }}
            />
        );
    }

    return (
        <div className="ui-canvas-layout">
            <header className="ui-canvas-header">
                <h1 className="ui-canvas-title">
                    <span className="text-indigo-600 dark:text-indigo-400 mr-2">Pipelines</span> Orchestrator
                </h1>
                <p className="ui-canvas-description">
                    Design and deploy serverless backend logic workflows using visual node graphs.
                </p>
            </header>

            <div className="ui-canvas-grid">
                <div className="ui-canvas-panel">
                    <div className="ui-canvas-panel-header">
                        <div>
                            <h2 className="ui-canvas-panel-title">Active Pipelines</h2>
                            <p className="ui-canvas-panel-subtitle">{"Collection: `pipelines`"}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSeedData} className="ui-canvas-btn-secondary border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-900/50 dark:hover:bg-purple-900/20">
                                <CloudUpload className="w-4 h-4 mr-2" /> Seed Local Pipelines
                            </button>
                            <button onClick={() => openEditor(null)} className="ui-canvas-btn-primary">
                                <Plus className="w-4 h-4 mr-2" /> Create Pipeline
                            </button>
                        </div>
                    </div>

                    <div className="ui-canvas-panel-content">
                        {loading ? (
                            <div className="ui-canvas-loading"><span className="animate-pulse">Loading engine...</span></div>
                        ) : pipelines.length === 0 ? (
                            <div className="ui-canvas-empty">No pipelines deployed yet.</div>
                        ) : (
                            <div className="ui-canvas-list">
                                {pipelines.map(item => {
                                    return (
                                        <div key={item.id} className="ui-canvas-list-item group">
                                            <div className="ui-canvas-list-item-content">
                                                <div className={`ui-canvas-list-item-icon ${item.isActive ? 'ui-canvas-bg-green ui-canvas-text-green' : 'ui-canvas-bg-gray ui-canvas-text-gray'}`}>
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="ui-canvas-list-item-title flex items-center gap-2">
                                                        {item.name || "Unnamed Pipeline"}
                                                        {item.isActive && <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400 border border-green-200 dark:border-green-800">Active</span>}
                                                    </div>
                                                    <div className="ui-canvas-list-item-subtitle">
                                                        {item.description || "No description provided."} • {item.nodes?.length || 0} Nodes
                                                    </div>
                                                    <div className="ui-canvas-list-item-id">ID: {item.id}</div>
                                                </div>
                                            </div>
                                            <div className="ui-canvas-list-item-actions">
                                                <button onClick={() => handleSyncToCloud(item.id as string)} disabled={isSyncing === item.id} className="ui-canvas-btn-secondary border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/50" title="Sync to Production Cloud">
                                                    {isSyncing === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => window.location.href = `/pipelines/${item.id}/logs`} className="ui-canvas-btn-secondary" title="View Execution Logs"><Activity className="w-4 h-4" /></button>
                                                <button onClick={() => handleDryRun(item)} className="ui-canvas-btn-secondary" title="Simulate Dry Run"><Play className="w-4 h-4" /></button>
                                                <button onClick={() => openEditor(item)} className="ui-canvas-btn-edit"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(item.id as string)} className="ui-canvas-btn-delete"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Dry Run Modal */}
            {dryRunResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-[#e3e8ee] dark:border-zinc-800">
                            <div>
                                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Simulation Result</h3>
                                <p className="text-sm text-zinc-500">{dryRunResult.pipelineName}</p>
                            </div>
                            <button onClick={() => setDryRunResult(null)} className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto bg-slate-950 flex-grow">
                            <pre className="text-xs font-mono text-green-400 whitespace-pre-wrap break-all">
                                {JSON.stringify(dryRunResult.result, null, 2)}
                            </pre>
                        </div>
                        <div className="p-4 border-t border-[#e3e8ee] dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end">
                            <button onClick={() => setDryRunResult(null)} className="ui-btn-primary">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
