"use client";

import React, { useState, useEffect } from "react";
import { OrchestratorClient } from "../../lib/orchestratorClient";
import { Button } from "@/components/ui/Button";
import { Zap, PlayCircle, Loader2, CheckCircle2, XCircle, Database } from "lucide-react";
import clsx from "clsx";

// The pipeline run UI relies heavily on generic listing and manual array manipulation.

type GenericEntity = {
    id: string;
    [key: string]: unknown;
};

type PipelineConfig = {
    id: string;
    flowName?: string; // some have flowName as custom metadata or just id
    [key: string]: unknown;
};

const SUPPORTED_ENTITIES = [
    // Global Elements
    "organization", "user", "auth", "place",
    // Multi-tenant Elements
    "fair", "exhibition", "exhibitor", "project", "warehouse", "workcenter",
    "shelve", "tool", "stand", "build", "emergency", "assembly", "part",
    "process", "calendar", "task", "rent", "message", "notification",
    "invoice", "payment", "tax", "apikey", "call", "alert", "product",
    "canvas", "material", "texture", "mesh", "bundle", "pipeline",
    "pipeline_execution", "ai_skill",
    // Special frontend aliases mapped by Orchestrator
    "organizationUser", "users"
];

export default function PipelineRunnerPage() {
    const [pipelines, setPipelines] = useState<PipelineConfig[]>([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState("");

    const [selectedEntity, setSelectedEntity] = useState("part");
    const [documents, setDocuments] = useState<GenericEntity[]>([]);
    const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

    const [loadingDocs, setLoadingDocs] = useState(false);
    const [running, setRunning] = useState(false);
    const [runResults, setRunResults] = useState<{ id: string, status: "success" | "error", message?: string }[]>([]);

    useEffect(() => {
        loadPipelines();
    }, []);

    useEffect(() => {
        loadDocuments();

        // Auto-select the first valid pipeline if available
        const currentEntityPipelines = pipelines.filter(p => p.id.split('-')[0] === selectedEntity);
        if (currentEntityPipelines.length > 0) {
            setSelectedPipelineId(currentEntityPipelines[0].id);
        } else {
            setSelectedPipelineId("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEntity, pipelines]);

    const loadPipelines = async () => {
        try {
            const data = await OrchestratorClient.list<PipelineConfig>("pipeline", { limit: 1000 });
            setPipelines(data || []);
        } catch (e) {
            console.error("Failed to load pipelines", e);
        }
    };

    const loadDocuments = async () => {
        setLoadingDocs(true);
        setSelectedDocIds(new Set());
        setRunResults([]);
        try {
            const data = await OrchestratorClient.list<GenericEntity>(selectedEntity, { limit: 50 });
            setDocuments(data || []);
        } catch (e) {
            console.error(`Failed to load documents for ${selectedEntity}`, e);
            setDocuments([]);
        } finally {
            setLoadingDocs(false);
        }
    };

    const toggleDocSelection = (id: string) => {
        const newSet = new Set(selectedDocIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedDocIds(newSet);
    };

    const toggleAll = () => {
        if (selectedDocIds.size === documents.length) {
            setSelectedDocIds(new Set());
        } else {
            setSelectedDocIds(new Set(documents.map(d => d.id)));
        }
    };

    const handleRunBatch = async (isDryRun: boolean = false) => {
        if (!selectedPipelineId || selectedDocIds.size === 0) return;

        setRunning(true);
        setRunResults([]);

        const results: { id: string, status: "success" | "error", message?: string }[] = [];

        const docsToRun = documents.filter(d => selectedDocIds.has(d.id));

        for (const doc of docsToRun) {
            try {
                const res = await OrchestratorClient.call({
                    entityId: selectedEntity,
                    actionId: "execute_pipeline",
                    payload: {
                        pipelineId: selectedPipelineId,
                        inputContext: doc,
                        isDryRun
                    }
                });

                if (res.status === "success" || res.data) {
                    results.push({ id: doc.id, status: "success" });
                } else {
                    results.push({ id: doc.id, status: "error", message: res.message || "Unknown error" });
                }
            } catch (e: unknown) {
                results.push({ id: doc.id, status: "error", message: (e as Error)?.message || "Execution exception" });
            }
        }

        setRunResults(results);
        setRunning(false);
    };

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <header className="border-b border-border pb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <span className="text-purple-600 dark:text-purple-400 mr-2">Pipeline</span> Runner
                </h1>
                <p className="text-muted-foreground mt-2">
                    Batch execute automation pipelines against specific documents.
                </p>
            </header>

            <div className="flex gap-6 flex-1 min-h-0">

                {/* Left panel: Controls */}
                <div className="w-80 flex flex-col gap-6 shrink-0 h-full overflow-y-auto pr-4">
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                            <Database className="w-4 h-4" /> 1. Target Entity
                        </h3>
                        <select
                            value={selectedEntity}
                            onChange={(e) => setSelectedEntity(e.target.value)}
                            className="w-full bg-background border border-border rounded p-2 text-sm focus:ring-1 focus:ring-purple-500"
                        >
                            {SUPPORTED_ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> 2. Select Pipeline
                        </h3>
                        <select
                            value={selectedPipelineId}
                            onChange={(e) => setSelectedPipelineId(e.target.value)}
                            className="w-full bg-background border border-border rounded p-2 text-sm focus:ring-1 focus:ring-purple-500 mb-2"
                        >
                            {pipelines.filter(p => p.id.split('-')[0] === selectedEntity).length === 0 && (
                                <option value="">No pipelines for this entity</option>
                            )}
                            {pipelines
                                .filter(p => p.id.split('-')[0] === selectedEntity)
                                .map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.flowName || p.id}
                                    </option>
                                ))}
                        </select>
                        <p className="text-[10px] text-muted-foreground">
                            The selected pipeline will receive the target document data as its `inputContext`.
                        </p>
                    </div>

                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex-1 flex flex-col">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                            <PlayCircle className="w-4 h-4" /> 3. Execution
                        </h3>

                        <div className="text-sm mb-4">
                            Selected: <span className="font-bold text-lg">{selectedDocIds.size}</span> documents
                        </div>

                        <div className="mt-auto flex flex-col gap-2">
                            <Button
                                variant="outline"
                                disabled={running || selectedDocIds.size === 0 || !selectedPipelineId}
                                onClick={() => handleRunBatch(true)}
                                className="w-full flex justify-center text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900"
                            >
                                Simulate (Dry Run)
                            </Button>

                            <Button
                                variant="primary"
                                disabled={running || selectedDocIds.size === 0 || !selectedPipelineId}
                                onClick={() => handleRunBatch(false)}
                                className="w-full flex justify-center bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {running && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Run {selectedDocIds.size} Pipelines
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right panel: Data List */}
                <div className="flex-1 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden relative">
                    <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                        <div className="font-semibold">
                            Data Table: <span className="text-purple-600">/{selectedEntity}</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={loadDocuments} disabled={loadingDocs}>
                            Refresh List
                        </Button>
                    </div>

                    <div className="flex-1 overflow-auto p-0">
                        {loadingDocs ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="flex items-center justify-center p-8 text-muted-foreground">
                                No records found for &apos;{selectedEntity}&apos;.
                            </div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 border-b border-border">
                                    <tr>
                                        <th className="p-3 w-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedDocIds.size === documents.length && documents.length > 0}
                                                onChange={toggleAll}
                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                            />
                                        </th>
                                        <th className="p-3">ID</th>
                                        <th className="p-3">Summary / Content</th>
                                        <th className="p-3 text-right">Run Result</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {documents.map(doc => {
                                        const isSelected = selectedDocIds.has(doc.id);
                                        const result = runResults.find(r => r.id === doc.id);

                                        // Attempt to find a string-like label
                                        const rawLabel = doc.name || doc.displayName || doc.code || doc.email || doc.title || "(No obvious label)";
                                        const summaryLabel = typeof rawLabel === "string" ? rawLabel : JSON.stringify(rawLabel);

                                        return (
                                            <tr
                                                key={doc.id}
                                                className={clsx(
                                                    "hover:bg-muted/30 transition-colors cursor-pointer",
                                                    isSelected && "bg-purple-50 dark:bg-purple-900/10"
                                                )}
                                                onClick={() => toggleDocSelection(doc.id)}
                                            >
                                                <td className="p-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => { }} // handled by row click
                                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                    />
                                                </td>
                                                <td className="p-3 font-mono text-xs text-muted-foreground">{doc.id}</td>
                                                <td className="p-3 font-medium">{summaryLabel}</td>
                                                <td className="p-3 text-right">
                                                    {result && (
                                                        <div className="flex items-center justify-end gap-1 text-xs">
                                                            {result.status === "success" ? (
                                                                <span className="text-green-600 flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full font-medium">
                                                                    <CheckCircle2 className="w-3 h-3" /> OK
                                                                </span>
                                                            ) : (
                                                                <span className="text-red-600 flex items-center gap-1 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full font-medium" title={result.message}>
                                                                    <XCircle className="w-3 h-3" /> Error
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
