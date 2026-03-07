"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save, Wrench } from "lucide-react";
import { OrchestratorClient } from "../../lib/orchestratorClient";

type LocalizedString = {
    it: string;
    en?: string;
    es?: string;
    de?: string;
};

type ToolEntity = {
    id?: string;
    name: LocalizedString;
    cost?: number;
    price?: number;
};

export default function PdmToolsAdminPage() {
    const [tools, setTools] = useState<ToolEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<ToolEntity | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await OrchestratorClient.list<ToolEntity>("tool", { limit: 100 });
            setTools(data || []);
        } catch (e) {
            console.error("Failed to load data", e);
            alert("Error loading tools");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openEditor = (item: ToolEntity | null) => {
        if (item) {
            setEditing(item);
        } else {
            // Defaults for new Tool
            setEditing({
                name: { it: "" },
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
                await OrchestratorClient.update("tool", payload);
            } else {
                await OrchestratorClient.create("tool", payload);
            }
            setEditing(null);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Error saving tool");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this Tool?")) return;
        try {
            await OrchestratorClient.delete("tool", id);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Error deleting tool");
        }
    };

    return (
        <div className="ui-canvas-layout">
            <header className="ui-canvas-header">
                <h1 className="ui-canvas-title">
                    <span className="text-zinc-600 dark:text-zinc-400 mr-2">Tools</span> Manager
                </h1>
                <p className="ui-canvas-description">
                    Manage the technical tools and equipment required to assemble the products in the PDM schema.
                </p>
            </header>

            <div className="ui-canvas-grid">
                <div className="ui-canvas-panel">
                    <div className="ui-canvas-panel-header">
                        <div>
                            <h2 className="ui-canvas-panel-title">Catalog Tools</h2>
                            <p className="ui-canvas-panel-subtitle">Collection: `tools`</p>
                        </div>
                        <button onClick={() => openEditor(null)} className="ui-canvas-btn-primary">
                            <Plus className="w-4 h-4 mr-2" /> Add Tool
                        </button>
                    </div>

                    <div className="ui-canvas-panel-content">
                        {editing ? (
                            <form onSubmit={handleSave} className="ui-canvas-form">
                                <div className="ui-canvas-form-header">
                                    <h3 className="ui-canvas-form-title">{editing.id ? "Edit Tool" : "New Tool"}</h3>
                                    <button type="button" onClick={() => openEditor(null)} className="ui-canvas-form-close"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="ui-canvas-form-grid">
                                    <div className="ui-canvas-form-col-1">
                                        <label className="ui-canvas-label">Name (IT) *</label>
                                        <input required value={editing.name?.it || ""} onChange={e => setEditing({ ...editing, name: { ...editing.name, it: e.target.value } })} className="ui-canvas-input" />
                                    </div>
                                    <div className="ui-canvas-form-col-1">
                                        <label className="ui-canvas-label">Name (EN)</label>
                                        <input value={editing.name?.en || ""} onChange={e => setEditing({ ...editing, name: { ...editing.name, en: e.target.value } })} className="ui-canvas-input" />
                                    </div>

                                    <div>
                                        <label className="ui-canvas-label text-green-600 dark:text-green-500">Cost (€)</label>
                                        <input type="number" step="0.01" value={editing.cost || ""} onChange={e => setEditing({ ...editing, cost: parseFloat(e.target.value) })} className="ui-canvas-input focus:outline-green-500" />
                                    </div>

                                    <div>
                                        <label className="ui-canvas-label text-blue-600 dark:text-blue-500">Price (€)</label>
                                        <input type="number" step="0.01" value={editing.price || ""} onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) })} className="ui-canvas-input focus:outline-blue-500" />
                                    </div>

                                </div>
                                <div className="ui-canvas-form-actions"><button type="submit" className="ui-canvas-btn-success"><Save className="w-4 h-4 mr-2" /> Save Tool</button></div>
                            </form>
                        ) : loading ? (
                            <div className="ui-canvas-loading"><span className="animate-pulse">Loading...</span></div>
                        ) : tools.length === 0 ? (
                            <div className="ui-canvas-empty">No tools found.</div>
                        ) : (
                            <div className="ui-canvas-list">
                                {tools.map(item => {
                                    return (
                                        <div key={item.id} className="ui-canvas-list-item group">
                                            <div className="ui-canvas-list-item-content">
                                                <div className="ui-canvas-list-item-icon ui-canvas-bg-gray ui-canvas-text-gray">
                                                    <Wrench className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="ui-canvas-list-item-title">
                                                        {item.name?.it || item.name?.en || "Unnamed"}
                                                    </div>
                                                    <div className="ui-canvas-list-item-subtitle">
                                                        Cost: €{item.cost?.toFixed(2) ?? "0.00"} / Price: €{item.price?.toFixed(2) ?? "0.00"}
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
