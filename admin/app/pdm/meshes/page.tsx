"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save, Box } from "lucide-react";
import { OrchestratorClient } from "../../lib/orchestratorClient";
// Local types matching mesh.ts
type MeshEntity = {
    id?: string;
    code: string;
    geometryType: "box" | "plane" | "cylinder" | "sphere" | "custom";
    dimensions?: [number, number, number];
    position?: [0, 0, 0];
    materialId?: string;
};

// Type for the local static materials
type Material = {
    id: string;
    name: string;
    code: string; // Used for the suffix of the code, e.g., MDF
};

export default function CanvasMeshesAdminPage() {
    const [meshes, setMeshes] = useState<MeshEntity[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<MeshEntity | null>(null);

    // Form inputs separated to compute the code automatically
    const [lenX, setLenX] = useState<number | string>(1.0); // meters
    const [lenY, setLenY] = useState<number | string>(1.0); // meters
    const [lenZ, setLenZ] = useState<number | string>(0.02); // meters
    const [selectedMat, setSelectedMat] = useState<string>("");

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Static Materials
            const matRes = await fetch("/admin/api/registry/materials");
            const matJson = await matRes.json();
            setMaterials(matJson.data || []);

            // Fetch Meshes using OrchestratorClient
            const data = await OrchestratorClient.list<MeshEntity>("mesh", { limit: 100 });
            setMeshes(data || []);
        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openEditor = (item: MeshEntity | null) => {
        setEditing(item);
        if (item) {
            setLenX(item.dimensions?.[0] ?? 1.0);
            setLenY(item.dimensions?.[1] ?? 1.0);
            setLenZ(item.dimensions?.[2] ?? 0.02);
            setSelectedMat(item.materialId ?? (materials.length > 0 ? materials[0].id : ""));
        } else {
            setLenX(1.0);
            setLenY(1.0);
            setLenZ(0.02);
            setSelectedMat("");
        }
    };

    // Effect to assign default material if empty new mesh
    useEffect(() => {
        if (materials.length > 0 && !selectedMat && editing && !editing.id) {
            setSelectedMat(materials[0].id);
        }
    }, [materials, selectedMat, editing]);

    // Compute code dynamically
    useEffect(() => {
        if (!editing) return;
        const mat = materials.find(m => m.id === selectedMat);
        const matSuffix = mat ? (mat.code || mat.name.toUpperCase().replace(/\s+/g, "")) : "UNK";

        // Convert meters to cm for the code with up to 1 decimal place (mm scale)
        const formatCm = (val: number | string) => Number((Number(val) * 100).toFixed(1)).toString();
        const code = `${formatCm(lenX)}x${formatCm(lenY)}x${formatCm(lenZ)}-${matSuffix}`;

        setEditing(prev => prev ? { ...prev, code, dimensions: [Number(lenX), Number(lenY), Number(lenZ)], materialId: selectedMat } : null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lenX, lenY, lenZ, selectedMat, materials]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;

        try {
            const payload = { ...editing };
            if (payload.id) {
                await OrchestratorClient.update("mesh", payload);
            } else {
                await OrchestratorClient.create("mesh", payload);
            }
            setEditing(null);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Error saving mesh");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this Mesh? This will break Canvas objects relying on it if any.")) return;
        try {
            await OrchestratorClient.delete("mesh", id);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Error deleting mesh");
        }
    };

    return (
        <div className="ui-canvas-layout">
            <header className="ui-canvas-header">
                <h1 className="ui-canvas-title">
                    <span className="text-blue-600 dark:text-blue-400 mr-2">Mesh</span> Manager
                </h1>
                <p className="ui-canvas-description">
                    Manage the 3D Meshes (atomic parts) used across projects. Measurements are stored in meters (m) but the generated code uses centimeters (cm).
                </p>
            </header>

            <div className="ui-canvas-grid">
                <div className="ui-canvas-panel">
                    <div className="ui-canvas-panel-header flex items-center justify-between">
                        <div>
                            <h2 className="ui-canvas-panel-title">Master Meshes</h2>
                            <p className="ui-canvas-panel-subtitle">Collection: `meshes`</p>
                        </div>
                        <button onClick={() => openEditor({ code: "", geometryType: "box", dimensions: [1.0, 1.0, 0.02] })} className="ui-canvas-btn-primary">
                            <Plus className="w-4 h-4 mr-2" /> Add Mesh
                        </button>
                    </div>

                    <div className="ui-canvas-panel-content">
                        {editing ? (
                            <form onSubmit={handleSave} className="ui-canvas-form">
                                <div className="ui-canvas-form-header">
                                    <h3 className="ui-canvas-form-title">{editing.id ? "Edit Mesh" : "New Mesh"}</h3>
                                    <button type="button" onClick={() => openEditor(null)} className="ui-canvas-form-close"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="ui-canvas-form-grid">
                                    <div className="ui-canvas-form-col-1">
                                        <label className="ui-canvas-label">Mesh Code (Auto) *</label>
                                        <input required readOnly value={editing.code || ""} className="ui-canvas-input-readonly" />
                                    </div>
                                    <div className="ui-canvas-form-col-1">
                                        <label className="ui-canvas-label">Material *</label>
                                        <select required value={selectedMat} onChange={e => setSelectedMat(e.target.value)} className="ui-canvas-select">
                                            <option value="" disabled>Select Material</option>
                                            {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.code || m.name})</option>)}
                                        </select>
                                    </div>

                                    <div className="ui-canvas-form-col-2 mt-2">
                                        <h4 className="text-sm font-bold border-b border-border pb-1 mb-2">Dimensions (Meters)</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="ui-canvas-label uppercase tracking-wider">Length (X axis)</label>
                                                <input type="number" step="0.001" min="0" required value={lenX} onChange={e => setLenX(e.target.value)} className="ui-canvas-input" />
                                            </div>
                                            <div>
                                                <label className="ui-canvas-label uppercase tracking-wider">Width/Depth (Y axis)</label>
                                                <input type="number" step="0.001" min="0" required value={lenY} onChange={e => setLenY(e.target.value)} className="ui-canvas-input" />
                                            </div>
                                            <div>
                                                <label className="ui-canvas-label uppercase tracking-wider">Height (Z axis)</label>
                                                <input type="number" step="0.001" min="0" required value={lenZ} onChange={e => setLenZ(e.target.value)} className="ui-canvas-input" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="ui-canvas-form-actions"><button type="submit" className="ui-canvas-btn-success"><Save className="w-4 h-4 mr-2" /> Save Mesh</button></div>
                            </form>
                        ) : loading ? (
                            <div className="ui-canvas-loading"><span className="animate-pulse">Loading...</span></div>
                        ) : meshes.length === 0 ? (
                            <div className="ui-canvas-empty">No meshes found.</div>
                        ) : (
                            <div className="ui-canvas-list">
                                {meshes.map(item => {
                                    const m = materials.find(mat => mat.id === item.materialId);
                                    return (
                                        <div key={item.id} className="ui-canvas-list-item hover:border-blue-500 group">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-10 h-10 rounded border shadow-sm bg-muted flex items-center justify-center text-muted-foreground">
                                                    <Box className="w-5 h-5" />
                                                </div>
                                                <div className="ui-canvas-list-item-content">
                                                    <div className="ui-canvas-list-item-title font-mono text-blue-600 dark:text-blue-400">
                                                        {item.code}
                                                    </div>
                                                    <div className="text-xs font-medium mt-0.5 text-muted-foreground">
                                                        Geometry: {item.geometryType}
                                                    </div>
                                                    <div className="ui-canvas-list-item-subtitle flex gap-3 mt-1">
                                                        <span>Dimensions: [{item.dimensions?.join(", ")}] m</span>
                                                        <span>Mat: {m?.name || item.materialId || "None"}</span>
                                                        <span>Type: {item.geometryType}</span>
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground mt-1 opacity-50 select-all font-mono">ID: {item.id}</div>
                                                </div>
                                            </div>
                                            <div className="ui-canvas-list-item-actions opacity-100">
                                                <button onClick={() => openEditor(item)} className="ui-canvas-btn-icon text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(item.id as string)} className="ui-canvas-btn-icon-danger"><Trash2 className="w-4 h-4" /></button>
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
