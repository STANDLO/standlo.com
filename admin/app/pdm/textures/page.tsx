"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save } from "lucide-react";

type Texture = {
    id?: string;
    name: string;
    type: "color" | "imageMap" | "normalMap" | "roughnessMap";
    valueLight: string;
    valueDark?: string;
    wrapS?: string;
    wrapT?: string;
    repeat?: [number, number];
    storageUrl?: string;
    compatibleMaterials?: string[];
};

export default function CanvasTexturesAdminPage() {
    const [items, setItems] = useState<Texture[]>([]);
    const [materials, setMaterials] = useState<Array<{ id: string; name: string; baseColor: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Texture | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resTex, resMat] = await Promise.all([
                fetch("/admin/api/registry/textures"),
                fetch("/admin/api/registry/materials")
            ]);
            const jsonTex = await resTex.json();
            const jsonMat = await resMat.json();
            setItems(jsonTex.data || []);
            setMaterials(jsonMat.data || []);
        } finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/admin/api/registry/textures", {
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
            await fetch(`/admin/api/registry/textures?id=${id}`, { method: "DELETE" });
            loadData();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="ui-canvas-layout">
            <header className="ui-canvas-header mb-6 shrink-0">
                <h1 className="ui-canvas-title">
                    <span className="text-purple-600 dark:text-purple-400 mr-2">Textures</span> Manager
                </h1>
                <p className="ui-canvas-description">
                    Manage the 3D textures (albedo, normal, roughness maps) for the Canvas 3D Editor.
                    These resources are synchronized as static JSON files in the core codebase.
                </p>
            </header>

            <div className="ui-canvas-panel">
                <div className="ui-canvas-panel-header flex items-center justify-between">
                    <div>
                        <h2 className="ui-canvas-panel-title">Textures (Maps)</h2>
                        <p className="ui-canvas-panel-subtitle">Static config: constants/canvas_textures.json</p>
                    </div>
                    <button onClick={() => setEditing({ name: "", type: "color", valueLight: "#ffffff", wrapS: "RepeatWrapping", wrapT: "RepeatWrapping", repeat: [1, 1], compatibleMaterials: [] })} className="ui-canvas-btn-primary">
                        <Plus className="w-4 h-4 mr-2" /> Add Texture
                    </button>
                </div>

                <div className="ui-canvas-panel-content">
                    {editing ? (
                        <form onSubmit={handleSave} className="ui-canvas-form">
                            <div className="ui-canvas-form-header">
                                <h3 className="ui-canvas-form-title">{editing.id ? "Edit Texture" : "New Texture"}</h3>
                                <button type="button" onClick={() => setEditing(null)} className="ui-canvas-form-close"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="ui-canvas-form-grid">
                                <div className="ui-canvas-form-col-2"><label className="ui-canvas-label">Name *</label><input required value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} className="ui-canvas-input focus:outline-purple-500" /></div>
                                <div className="ui-canvas-form-col-1">
                                    <label className="ui-canvas-label">Type *</label>
                                    <select required value={editing.type} onChange={e => setEditing({ ...editing, type: e.target.value as Texture["type"] })} className="ui-canvas-select focus:outline-purple-500">
                                        <option value="color">Color</option>
                                        <option value="imageMap">Image Map</option>
                                        <option value="normalMap">Normal Map</option>
                                        <option value="roughnessMap">Roughness Map</option>
                                    </select>
                                </div>
                                <div className="ui-canvas-form-col-1">
                                    <label className="ui-canvas-label">Light URL / Hex *</label>
                                    {editing.type === "color" ? (
                                        <input type="color" required value={editing.valueLight || "#ffffff"} onChange={e => setEditing({ ...editing, valueLight: e.target.value })} className="w-full h-[38px] cursor-pointer" />
                                    ) : (
                                        <input required value={editing.valueLight || ""} onChange={e => setEditing({ ...editing, valueLight: e.target.value })} placeholder="https://..." className="ui-canvas-input focus:outline-purple-500" />
                                    )}
                                </div>
                                <div className="ui-canvas-form-col-1"><label className="ui-canvas-label">Dark URL / Hex (optional)</label><input value={editing.valueDark || ""} onChange={e => setEditing({ ...editing, valueDark: e.target.value })} className="ui-canvas-input focus:outline-purple-500" /></div>
                                <div className="ui-canvas-form-col-1">
                                    <label className="ui-canvas-label">Wrap S</label>
                                    <select value={editing.wrapS || "RepeatWrapping"} onChange={e => setEditing({ ...editing, wrapS: e.target.value })} className="ui-canvas-select focus:outline-purple-500">
                                        <option value="RepeatWrapping">RepeatWrapping</option>
                                        <option value="ClampToEdgeWrapping">ClampToEdgeWrapping</option>
                                        <option value="MirroredRepeatWrapping">MirroredRepeatWrapping</option>
                                    </select>
                                </div>
                                <div className="ui-canvas-form-col-1">
                                    <label className="ui-canvas-label">Wrap T</label>
                                    <select value={editing.wrapT || "RepeatWrapping"} onChange={e => setEditing({ ...editing, wrapT: e.target.value })} className="ui-canvas-select focus:outline-purple-500">
                                        <option value="RepeatWrapping">RepeatWrapping</option>
                                        <option value="ClampToEdgeWrapping">ClampToEdgeWrapping</option>
                                        <option value="MirroredRepeatWrapping">MirroredRepeatWrapping</option>
                                    </select>
                                </div>
                                <div className="ui-canvas-form-col-1"><label className="ui-canvas-label">Repeat X</label><input type="number" step="0.1" value={editing.repeat?.[0] || 1} onChange={e => setEditing({ ...editing, repeat: [parseFloat(e.target.value), editing.repeat?.[1] || 1] })} className="ui-canvas-input focus:outline-purple-500" /></div>
                                <div className="ui-canvas-form-col-1"><label className="ui-canvas-label">Repeat Y</label><input type="number" step="0.1" value={editing.repeat?.[1] || 1} onChange={e => setEditing({ ...editing, repeat: [editing.repeat?.[0] || 1, parseFloat(e.target.value)] })} className="ui-canvas-input focus:outline-purple-500" /></div>
                            </div>
                            <div className="ui-canvas-form-col-2 mt-4">
                                <label className="ui-canvas-label mb-2">Compatible Materials</label>
                                <div className="flex flex-wrap gap-2">
                                    {materials.map(mat => (
                                        <label key={mat.id} className="flex items-center space-x-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 px-3 py-1.5 rounded-md cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                            <input
                                                type="checkbox"
                                                checked={editing.compatibleMaterials?.includes(mat.id) || false}
                                                onChange={(e) => {
                                                    const current = editing.compatibleMaterials || [];
                                                    if (e.target.checked) setEditing({ ...editing, compatibleMaterials: [...current, mat.id] });
                                                    else setEditing({ ...editing, compatibleMaterials: current.filter(id => id !== mat.id) });
                                                }}
                                                className="rounded border-slate-300 dark:border-white/10 text-purple-600 focus:ring-purple-500"
                                            />
                                            <div className="w-3 h-3 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: mat.baseColor }}></div>
                                            <span className="text-sm">{mat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="ui-canvas-form-actions"><button type="submit" className="ui-canvas-btn-primary"><Save className="w-4 h-4 mr-2" /> Save Texture</button></div>
                        </form>
                    ) : loading ? (
                        <div className="ui-canvas-loading"><span className="animate-pulse">Loading...</span></div>
                    ) : items.length === 0 ? (
                        <div className="ui-canvas-empty">No static textures defined yet.</div>
                    ) : (
                        <div className="ui-canvas-list">
                            {items.map(item => (
                                <div key={item.id} className="ui-canvas-list-item hover:border-purple-500 group">
                                    <div className="flex items-center space-x-4">
                                        {item.type === "color" ? (
                                            <div className="w-12 h-12 rounded-md border shadow-sm" style={{ backgroundColor: item.valueLight }}></div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-md border shadow-sm flex items-center justify-center bg-muted text-[8px] overflow-hidden">
                                                {item.valueLight.startsWith('http') ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={item.valueLight} className="w-full h-full object-cover" alt="texture" />
                                                ) : 'IMG'}
                                            </div>
                                        )}
                                        <div className="ui-canvas-list-item-content">
                                            <div className="ui-canvas-list-item-title flex items-center gap-2">
                                                {item.name}
                                                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-1 py-0.5 rounded uppercase">{item.type}</span>
                                            </div>
                                            <div className="ui-canvas-list-item-subtitle flex gap-2 mt-0.5">
                                                {item.type !== "color" && <span>Wrap: {item.wrapS}</span>}
                                                <span>Repeat: [{item.repeat?.[0]}, {item.repeat?.[1]}]</span>
                                                {item.compatibleMaterials && item.compatibleMaterials.length > 0 && <span>• {item.compatibleMaterials.length} Compatible Materials</span>}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-1 opacity-50 select-all font-mono">ID: {item.id}</div>
                                        </div>
                                    </div>
                                    <div className="ui-canvas-list-item-actions opacity-100">
                                        <button onClick={() => setEditing(item)} className="ui-canvas-btn-icon text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"><Edit2 className="w-4 h-4" /></button>
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
