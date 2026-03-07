"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save, Activity, Settings } from "lucide-react";
import { OrchestratorClient } from "../../lib/orchestratorClient";
import { auth } from "@/core/firebase";
import { SystemRoleOptions } from "@standlo/functions/src/schemas/primitives";



type ProcessEntity = {
    id?: string;
    code: string;
    name: string;
    phase?: "CLIENT IN" | "DESIGN/ENG" | "CLIENT APP." | "FABRICATION" | "WAREHOUSE" | "LOGISTICS" | "ON-SITE" | "STRIKE" | "RECOVERY" | "CLOSING";
    description?: string;
    requiredRole?: string;
    timeMatrix?: Record<string, unknown>[];
    cost?: number;
    price?: number;
};

export default function PdmProcessesAdminPage() {
    const [processes, setProcesses] = useState<ProcessEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<ProcessEntity | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await OrchestratorClient.list<ProcessEntity>("process", { limit: 100 });
            setProcesses(data || []);
        } catch (e) {
            console.error("Failed to load data", e);
            alert("Error loading processes");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openEditor = (item: ProcessEntity | null) => {
        if (item) {
            setEditing(item);
        } else {
            // Defaults for new Process
            setEditing({
                code: "",
                name: "",
                phase: "FABRICATION",
                description: "",
                requiredRole: "standbuilder",
                timeMatrix: [],
                cost: 0,
                price: 0
            });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;

        try {
            const payload = { ...editing };
            if (payload.id) {
                await OrchestratorClient.update("process", payload);
            } else {
                await OrchestratorClient.create("process", payload);
            }
            setEditing(null);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Error saving process");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this Process?")) return;
        try {
            await OrchestratorClient.delete("process", id);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Error deleting process");
        }
    };

    const handleSeed = async () => {
        if (!confirm("Are you sure you want to seed processes from CSV? This will create new records.")) return;
        try {
            const currentUser = auth.currentUser;
            let idToken = "";
            if (currentUser) {
                idToken = await currentUser.getIdToken();
            }

            const res = await fetch("/admin/api/seed/processes", {
                method: "POST",
                headers: {
                    ...(idToken ? { "Authorization": `Bearer ${idToken} ` } : {})
                }
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                loadData();
            } else {
                alert(`Error: ${data.message} `);
                console.error(data);
            }
        } catch (e) {
            console.error(e);
            alert("Failed to seed processes");
        }
    };

    return (
        <div className="ui-canvas-layout">
            <header className="ui-canvas-header">
                <h1 className="ui-canvas-title">
                    <span className="text-teal-600 dark:text-teal-400 mr-2">Processes</span> Manager
                </h1>
                <p className="ui-canvas-description">
                    Manage the technical and manual Processes applied to Parts and Assemblies.
                </p>
            </header>

            <div className="ui-canvas-grid">
                <div className="ui-canvas-panel">
                    <div className="ui-canvas-panel-header">
                        <div>
                            <h2 className="ui-canvas-panel-title">Catalog Processes</h2>
                            <p className="ui-canvas-panel-subtitle">{"Collection: `processes`"}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleSeed} className="ui-canvas-btn-secondary">
                                <Settings className="w-4 h-4 mr-2" /> Seed Processes
                            </button>
                            <button onClick={() => openEditor(null)} className="ui-canvas-btn-primary">
                                <Plus className="w-4 h-4 mr-2" /> Add Process
                            </button>
                        </div>
                    </div>

                    <div className="ui-canvas-panel-content">
                        {editing ? (
                            <form onSubmit={handleSave} className="ui-canvas-form">
                                <div className="ui-canvas-form-header">
                                    <h3 className="ui-canvas-form-title">{editing.id ? "Edit Process" : "New Process"}</h3>
                                    <button type="button" onClick={() => setEditing(null)} className="ui-canvas-form-close"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="ui-canvas-form-grid">
                                    <div className="ui-canvas-form-col-1">
                                        <label className="ui-canvas-label">Code *</label>
                                        <input required value={editing.code || ""} onChange={e => setEditing({ ...editing, code: e.target.value })} className="ui-canvas-input" />
                                    </div>
                                    <div className="ui-canvas-form-col-1">
                                        <label className="ui-canvas-label">Name (EN) *</label>
                                        <input required value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} className="ui-canvas-input" />
                                    </div>
                                    <div className="ui-canvas-form-col-1">
                                        <label className="ui-canvas-label">Phase</label>
                                        <select value={editing.phase || "FABRICATION"} onChange={e => setEditing({ ...editing, phase: e.target.value as ProcessEntity["phase"] })} className="ui-canvas-select">
                                            <option value="CLIENT IN">CLIENT IN</option>
                                            <option value="DESIGN/ENG">DESIGN/ENG</option>
                                            <option value="CLIENT APP.">CLIENT APP.</option>
                                            <option value="FABRICATION">FABRICATION</option>
                                            <option value="WAREHOUSE">WAREHOUSE</option>
                                            <option value="LOGISTICS">LOGISTICS</option>
                                            <option value="ON-SITE">ON-SITE</option>
                                            <option value="STRIKE">STRIKE</option>
                                            <option value="RECOVERY">RECOVERY</option>
                                            <option value="CLOSING">CLOSING</option>
                                        </select>
                                    </div>
                                    <div className="ui-canvas-form-col-1">
                                        <label className="ui-canvas-label">Required Role</label>
                                        <select value={editing.requiredRole || ""} onChange={e => setEditing({ ...editing, requiredRole: e.target.value })} className="ui-canvas-select">
                                            <option value="">-- No Specific Role --</option>
                                            {SystemRoleOptions.map((opt) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="ui-canvas-label">Description</label>
                                        <textarea value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} className="ui-canvas-input" rows={3}></textarea>
                                    </div>

                                    <div>
                                        <label className="ui-canvas-label text-green-600 dark:text-green-500">Cost per Hour (€)</label>
                                        <input type="number" step="0.01" value={editing.cost || ""} onChange={e => setEditing({ ...editing, cost: parseFloat(e.target.value) })} className="ui-canvas-input focus:outline-green-500" />
                                    </div>

                                    <div>
                                        <label className="ui-canvas-label text-blue-600 dark:text-blue-500">Price per Hour (€)</label>
                                        <input type="number" step="0.01" value={editing.price || ""} onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) })} className="ui-canvas-input focus:outline-blue-500" />
                                    </div>

                                </div>
                                <div className="ui-canvas-form-actions"><button type="submit" className="ui-canvas-btn-success"><Save className="w-4 h-4 mr-2" /> Save Process</button></div>
                            </form>
                        ) : loading ? (
                            <div className="ui-canvas-loading"><span className="animate-pulse">Loading...</span></div>
                        ) : processes.length === 0 ? (
                            <div className="ui-canvas-empty">No processes found.</div>
                        ) : (
                            <div className="ui-canvas-list">
                                {processes.map(item => {
                                    return (
                                        <div key={item.id} className="ui-canvas-list-item group">
                                            <div className="ui-canvas-list-item-content">
                                                <div className="ui-canvas-list-item-icon ui-canvas-bg-blue ui-canvas-text-blue">
                                                    <Activity className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="ui-canvas-list-item-title">
                                                        [{item.code || "NO-CODE"}] {typeof item.name === 'string' ? item.name : (item.name as unknown as { it?: string })?.it || "Unnamed"} - {item.phase || "FABRICATION"}
                                                    </div>
                                                    <div className="ui-canvas-list-item-subtitle">
                                                        Role: {item.requiredRole || "Any"} • Cost/hr: €{item.cost?.toFixed(2) ?? "0.00"} / Price/hr: €{item.price?.toFixed(2) ?? "0.00"}
                                                    </div>
                                                    <div className="ui-canvas-list-item-id">ID: {item.id}</div>
                                                </div>
                                            </div>
                                            <div className="ui-canvas-list-item-actions">
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
        </div>
    );
}
