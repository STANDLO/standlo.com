"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import { OrchestratorClient } from "../../../lib/orchestratorClient";

interface PipelineExecutionLog {
    id: string;
    pipelineId: string;
    status: 'success' | 'error' | 'running';
    startedAt: string;
    completedAt: string;
    triggeredBy?: string;
    log?: unknown[];
}

export default function PipelineLogsPage() {
    const params = useParams();
    const router = useRouter();
    const pipelineId = params.id as string;

    const [logs, setLogs] = useState<PipelineExecutionLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await OrchestratorClient.list<PipelineExecutionLog>("pipeline_execution", {
                    filters: [{ field: "pipelineId", op: "==", value: pipelineId }],
                    orderBy: [{ field: "startedAt", direction: "desc" }],
                    limit: 100
                });
                setLogs(data || []);
            } catch (e) {
                console.error("Failed to load logs", e);
                alert("Error loading execution logs");
            } finally {
                setLoading(false);
            }
        };

        if (pipelineId) {
            loadData();
        }
    }, [pipelineId]);

    return (
        <div className="ui-canvas-layout">
            <header className="ui-canvas-header pb-4 border-b border-[#e3e8ee] dark:border-zinc-800 flex justify-between items-center">
                <div>
                    <h1 className="ui-canvas-title">
                        <span className="text-indigo-600 dark:text-indigo-400 mr-2">Execution Logs</span>
                    </h1>
                    <p className="ui-canvas-description">
                        Monitoring pipeline {pipelineId} and its execution history.
                    </p>
                </div>
                <button
                    onClick={() => router.push('/pipelines')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-[#e3e8ee] dark:border-zinc-700 rounded transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Pipelines
                </button>
            </header>

            <div className="ui-canvas-grid mt-6">
                <div className="ui-canvas-panel">
                    <div className="ui-canvas-panel-header">
                        <div>
                            <h2 className="ui-canvas-panel-title">Execution History</h2>
                        </div>
                    </div>

                    <div className="ui-canvas-panel-content">
                        {loading ? (
                            <div className="p-8 text-center text-zinc-500"><span className="animate-pulse">Loading logs...</span></div>
                        ) : logs.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">No executions found for this pipeline. Start a Dry Run or wait for a trigger.</div>
                        ) : (
                            <div className="space-y-4">
                                {logs.map((log) => (
                                    <div key={log.id} className="border border-[#e3e8ee] dark:border-zinc-800 rounded-md bg-white dark:bg-zinc-900 overflow-hidden">
                                        <div className="flex items-center justify-between p-4 border-b border-[#e3e8ee] dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                                            <div className="flex items-center gap-3">
                                                {log.status === 'success' ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-500" />
                                                )}
                                                <div>
                                                    <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                                        Execution {log.id}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(log.startedAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                Duration: {new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()}ms
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-900 dark:bg-zinc-950 overflow-x-auto text-xs font-mono text-zinc-300">
                                            <details>
                                                <summary className="cursor-pointer text-indigo-400 hover:text-indigo-300 mb-2">View Raw Log Data</summary>
                                                <pre className="mt-2 text-[11px] whitespace-pre-wrap">
                                                    {JSON.stringify(log.log, null, 2)}
                                                </pre>
                                            </details>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
