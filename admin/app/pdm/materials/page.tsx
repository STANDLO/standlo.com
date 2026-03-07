"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save } from "lucide-react";

type Material = {
    id?: string;
    name: string;
    description?: string;
    baseColor?: string;
    roughness?: number;
    metalness?: number;
    opacity?: number;
    transparent?: boolean;
    albedoId?: string;
    normalId?: string;
    roughnessId?: string;
};

export default function CanvasMaterialsAdminPage() {
    const [items, setItems] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Material | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/admin/api/registry/materials");
            const json = await res.json();
            setItems(json.data || []);
        } finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/admin/api/registry/materials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editing)
            });
            if (res.ok) { setEditing(null); loadData(); }
            else { alert("Validation failed. Check inputs."); }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        try {
            await fetch(`/admin/api/registry/materials?id=${id}`, { method: "DELETE" });
            loadData();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="ui-canvas-layout">
            <header className="ui-canvas-header mb-6 shrink-0">
                <h1 className="ui-canvas-title">
                    <span className="text-blue-600 dark:text-blue-400 mr-2">Materials</span> Manager
                </h1>
                <p className="ui-canvas-description">
                    Manage the 3D materials (PBR parameters) for the Canvas 3D Editor.
                    These resources are synchronized as static JSON files in the core codebase.
                </p>
            </header>

            <div className="ui-canvas-panel">
                <div className="ui-canvas-panel-header flex items-center justify-between">
                    <div>
                        <h2 className="ui-canvas-panel-title">Materials (PBR)</h2>
                        <p className="ui-canvas-panel-subtitle">Static config: constants/canvas_materials.json</p>
                    </div>
                    <button onClick={() => setEditing({ name: "", baseColor: "#ffffff", roughness: 0.5, metalness: 0, opacity: 1, transparent: false })} className="ui-canvas-btn-primary">
                        <Plus className="w-4 h-4 mr-2" /> Add Material
                    </button>
                </div>

                <div className="ui-canvas-panel-content">
                    {editing ? (
                        <form onSubmit={handleSave} className="ui-canvas-form">
                            <div className="ui-canvas-form-header">
                                <h3 className="ui-canvas-form-title">{editing.id ? "Edit Material" : "New Material"}</h3>
                                <button type="button" onClick={() => setEditing(null)} className="ui-canvas-form-close"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="ui-canvas-form-grid">
                                <div className="ui-canvas-form-col-1"><label className="ui-canvas-label">Name *</label><input required value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} className="ui-canvas-input" /></div>
                                <div className="ui-canvas-form-col-1"><label className="ui-canvas-label">Base Color</label><input type="color" value={editing.baseColor || "#ffffff"} onChange={e => setEditing({ ...editing, baseColor: e.target.value })} className="w-full h-[38px] cursor-pointer" /></div>
                                <div className="ui-canvas-form-col-1"><label className="ui-canvas-label">Roughness (0-1)</label><input type="number" step="0.1" min="0" max="1" value={editing.roughness ?? 0.5} onChange={e => setEditing({ ...editing, roughness: parseFloat(e.target.value) })} className="ui-canvas-input" /></div>
                                <div className="ui-canvas-form-col-1"><label className="ui-canvas-label">Metalness (0-1)</label><input type="number" step="0.1" min="0" max="1" value={editing.metalness ?? 0} onChange={e => setEditing({ ...editing, metalness: parseFloat(e.target.value) })} className="ui-canvas-input" /></div>
                                <div className="ui-canvas-form-col-1"><label className="ui-canvas-label">Opacity (0-1)</label><input type="number" step="0.1" min="0" max="1" value={editing.opacity ?? 1} onChange={e => setEditing({ ...editing, opacity: parseFloat(e.target.value) })} className="ui-canvas-input" /></div>
                                <div className="ui-canvas-form-col-1 ui-canvas-flex-start mt-6">
                                    <input type="checkbox" id="transparent" checked={editing.transparent || false} onChange={e => setEditing({ ...editing, transparent: e.target.checked })} className="ui-canvas-checkbox" />
                                    <label htmlFor="transparent" className="ui-canvas-label mb-0 cursor-pointer">Transparent</label>
                                </div>
                                <div className="ui-canvas-form-col-1"><label className="ui-canvas-label">Albedo Map ID</label><input value={editing.albedoId || ""} onChange={e => setEditing({ ...editing, albedoId: e.target.value })} placeholder="Texture ID" className="ui-canvas-input" /></div>
                                <div className="ui-canvas-form-col-1"><label className="ui-canvas-label">Normal Map ID</label><input value={editing.normalId || ""} onChange={e => setEditing({ ...editing, normalId: e.target.value })} placeholder="Texture ID" className="ui-canvas-input" /></div>
                            </div>
                            <div className="ui-canvas-form-actions"><button type="submit" className="ui-canvas-btn-success"><Save className="w-4 h-4 mr-2" /> Save Material</button></div>
                        </form>
                    ) : loading ? (
                        <div className="ui-canvas-loading"><span className="animate-pulse">Loading...</span></div>
                    ) : items.length === 0 ? (
                        <div className="ui-canvas-empty">No static materials defined yet.</div>
                    ) : (
                        <div className="ui-canvas-list">
                            {items.map(item => (
                                <div key={item.id} className="ui-canvas-list-item hover:border-blue-500 group">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-full border shadow-sm" style={{ backgroundColor: item.baseColor || "#fff" }}></div>
                                        <div className="ui-canvas-list-item-content">
                                            <div className="ui-canvas-list-item-title flex items-center gap-2">
                                                {item.name}
                                                {item.transparent && <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1 py-0.5 rounded">Transparent</span>}
                                            </div>
                                            <div className="ui-canvas-list-item-subtitle flex gap-2 mt-0.5">
                                                <span>R: {item.roughness}</span>
                                                <span>M: {item.metalness}</span>
                                                {item.albedoId && <span className="text-blue-500">Tex: {item.albedoId}</span>}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-1 opacity-50 select-all font-mono">ID: {item.id}</div>
                                        </div>
                                    </div>
                                    <div className="ui-canvas-list-item-actions opacity-100">
                                        <button onClick={() => setEditing(item)} className="ui-canvas-btn-icon text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(item.id as string)} className="ui-canvas-btn-icon-danger"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
