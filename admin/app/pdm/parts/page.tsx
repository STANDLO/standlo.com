"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save, Layers } from "lucide-react";
import { OrchestratorClient } from "../../lib/orchestratorClient";

import { PART_CATEGORIES_BY_SECTOR } from "@standlo/functions/src/schemas/part";

// Local types matching part.ts & primitives (Localized String)
type LocalizedString = {
    it: string;
    en?: string;
    es?: string;
    de?: string;
};

type PartEntity = {
    id?: string;
    code: string;
    name: string;
    description?: LocalizedString;
    sector: string;
    category: string;
    isRentable?: boolean;
    isSellable?: boolean;
    isConsumable?: boolean;
    baseUnit?: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    meshId?: string;
    gltfUrl?: string;
    sockets?: Record<string, unknown>[];
    cost?: number;
    price?: number;
};

type MeshEntity = {
    id: string;
    code: string;
};

export default function CanvasPartsAdminPage() {
    const [parts, setParts] = useState<PartEntity[]>([]);
    const [meshes, setMeshes] = useState<MeshEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<PartEntity | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Meshes for the dropdown
            const meshesData = await OrchestratorClient.list<MeshEntity>("mesh", { limit: 1000 });
            setMeshes(meshesData || []);

            // Fetch Parts
            const partsData = await OrchestratorClient.list<PartEntity>("part", { limit: 100 });
            setParts(partsData || []);
        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openEditor = (item: PartEntity | null) => {
        if (item) {
            setEditing(item);
        } else {
            // Defaults for new Part
            setEditing({
                code: "",
                name: "",
                sector: "exhibition",
                category: Object.keys(PART_CATEGORIES_BY_SECTOR["exhibition"] || {})[0] || "",
                isRentable: true,
                isSellable: true,
                isConsumable: false,
                baseUnit: "pcs",
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                meshId: "",
                gltfUrl: "",
                sockets: []
            });
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;

        try {
            const payload = { ...editing };

            // Clean up empty optional relationships
            if (!payload.meshId) delete payload.meshId;
            if (!payload.gltfUrl) delete payload.gltfUrl;

            if (payload.id) {
                await OrchestratorClient.update("part", payload);
            } else {
                await OrchestratorClient.create("part", payload);
            }
            setEditing(null);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Error saving part");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this Part?")) return;
        try {
            await OrchestratorClient.delete("part", id);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Error deleting part");
        }
    };

    return (
        <div className="ui-canvas-layout">
            <header className="ui-canvas-header">
                <h1 className="ui-canvas-title">
                    <span className="text-orange-600 dark:text-orange-400 mr-2">Parts</span> Manager
                </h1>
                <p className="ui-canvas-description">
                    Manage the semantic 3D Parts (catalog products) inheriting pure geometry from Meshes.
                </p>
            </header>

            <div className="ui-canvas-grid">
                <div className="ui-canvas-panel">
                    <div className="ui-canvas-panel-header">
                        <div>
                            <h2 className="ui-canvas-panel-title">Catalog Parts</h2>
                            <p className="ui-canvas-panel-subtitle">Collection: `parts`</p>
                        </div>
                        <button onClick={() => openEditor(null)} className="ui-canvas-btn-primary">
                            <Plus className="w-4 h-4 mr-2" /> Add Part
                        </button>
                    </div>

                    <div className="ui-canvas-panel-content">
                        {editing ? (
                            <form onSubmit={handleSave} className="ui-canvas-form">
                                <div className="ui-canvas-form-header">
                                    <h3 className="ui-canvas-form-title">{editing.id ? "Edit Part" : "New Part"}</h3>
                                    <button type="button" onClick={() => openEditor(null)} className="ui-canvas-form-close"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="ui-canvas-form-grid">
                                    <div className="ui-canvas-form-col-1">
                                        <label className="ui-canvas-label">Part Code *</label>
                                        <input required value={editing.code || ""} onChange={e => setEditing({ ...editing, code: e.target.value })} className="ui-canvas-input" />
                                    </div>
                                    <div className="ui-canvas-form-col-1">
                                        <label className="ui-canvas-label">Name (EN) *</label>
                                        <input required value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} className="ui-canvas-input" />
                                    </div>

                                    <div>
                                        <label className="ui-canvas-label">Sector *</label>
                                        <select required value={editing.sector} onChange={e => {
                                            const newSector = e.target.value;
                                            const firstCat = Object.keys(PART_CATEGORIES_BY_SECTOR[newSector] || {})[0] || "";
                                            setEditing({ ...editing, sector: newSector, category: firstCat });
                                        }} className="ui-canvas-select">
                                            <option value="exhibition">Exhibition</option>
                                            <option value="construction">Construction</option>
                                            <option value="audio_video">Audio / Video</option>
                                            <option value="electrical">Electrical</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="ui-canvas-label">Category *</label>
                                        <select required value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} className="ui-canvas-select">
                                            {Object.entries(PART_CATEGORIES_BY_SECTOR[editing.sector] || {}).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="ui-canvas-label">Base Unit</label>
                                        <select required value={editing.baseUnit || "pcs"} onChange={e => setEditing({ ...editing, baseUnit: e.target.value })} className="ui-canvas-select">
                                            <option value="pcs">Pieces (pcs)</option>
                                            <option value="sqm">Square Meters (sqm)</option>
                                            <option value="lm">Linear Meters (lm)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="ui-canvas-label text-green-600 dark:text-green-500">Cost (€)</label>
                                        <input type="number" step="0.01" value={editing.cost || ""} onChange={e => setEditing({ ...editing, cost: parseFloat(e.target.value) })} className="ui-canvas-input focus:outline-green-500" />
                                    </div>

                                    <div>
                                        <label className="ui-canvas-label text-blue-600 dark:text-blue-500">Price (€)</label>
                                        <input type="number" step="0.01" value={editing.price || ""} onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) })} className="ui-canvas-input focus:outline-blue-500" />
                                    </div>


                                    <div className="ui-canvas-form-checkbox-group">
                                        <label className="ui-canvas-form-checkbox-label">
                                            <input type="checkbox" checked={editing.isRentable} onChange={e => setEditing({ ...editing, isRentable: e.target.checked })} /> Rentable
                                        </label>
                                        <label className="ui-canvas-form-checkbox-label">
                                            <input type="checkbox" checked={editing.isSellable} onChange={e => setEditing({ ...editing, isSellable: e.target.checked })} /> Sellable
                                        </label>
                                        <label className="ui-canvas-form-checkbox-label">
                                            <input type="checkbox" checked={editing.isConsumable} onChange={e => setEditing({ ...editing, isConsumable: e.target.checked })} /> Consumable
                                        </label>
                                    </div>

                                    {/* 3D Properties */}
                                    <div className="ui-canvas-form-col-2 ui-canvas-form-section">
                                        <h4 className="ui-canvas-form-section-title">3D Properties / Geometric Inheritance</h4>
                                        <div className="ui-canvas-form-grid">
                                            <div>
                                                <label className="text-xs text-blue-500 font-bold mb-1 block">Mesh ID (Inheritance)</label>
                                                <select
                                                    value={editing.meshId || ""}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        const selectedMesh = meshes.find(m => m.id === val);

                                                        let generatedName = editing.name;
                                                        if (selectedMesh && selectedMesh.code.includes("-")) {
                                                            const parts = selectedMesh.code.split('-');
                                                            if (parts.length >= 2) {
                                                                const dimensions = parts[0];
                                                                const materialInfo = parts.slice(1).join("-");
                                                                generatedName = `${materialInfo} - ${dimensions} cm`;
                                                            }
                                                        }

                                                        setEditing({
                                                            ...editing,
                                                            meshId: val,
                                                            code: selectedMesh ? selectedMesh.code : editing.code,
                                                            name: generatedName
                                                        });
                                                    }}
                                                    className="ui-canvas-select border-blue-200 dark:border-blue-900 focus:outline-blue-500"
                                                >
                                                    <option value="">-- No pure mesh inheritance --</option>
                                                    {meshes.map(m => <option key={m.id} value={m.id}>{m.code}</option>)}
                                                </select>
                                                <p className="text-[10px] text-muted-foreground mt-1">Select a core mesh to inherit dimension and base logic.</p>
                                            </div>
                                            <div>
                                                <label className="text-xs text-purple-500 font-bold mb-1 block">GLTF/GLB URL (Override)</label>
                                                <input value={editing.gltfUrl || ""} onChange={e => setEditing({ ...editing, gltfUrl: e.target.value })} placeholder="https://..." className="ui-canvas-input border-purple-200 dark:border-purple-900 focus:outline-purple-500" />
                                                <p className="text-[10px] text-muted-foreground mt-1">Use a compressed draco 3D model link instead of pure mesh.</p>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                                <div className="ui-canvas-form-actions"><button type="submit" className="ui-canvas-btn-success"><Save className="w-4 h-4 mr-2" /> Save Part</button></div>
                            </form>
                        ) : loading ? (
                            <div className="ui-canvas-loading"><span className="animate-pulse">Loading...</span></div>
                        ) : parts.length === 0 ? (
                            <div className="ui-canvas-empty">No parts found.</div>
                        ) : (
                            <div className="ui-canvas-list">
                                {parts.map(item => {
                                    const m = meshes.find(mat => mat.id === item.meshId);
                                    return (
                                        <div key={item.id} className="ui-canvas-list-item group">
                                            <div className="ui-canvas-list-item-content">
                                                <div className="ui-canvas-list-item-icon ui-canvas-bg-orange ui-canvas-text-orange">
                                                    <Layers className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="ui-canvas-list-item-title">
                                                        [{item.code}] {item.name || "Unnamed"}
                                                        {item.meshId && <span className="ui-canvas-subcollection-badge ui-canvas-bg-blue ui-canvas-text-blue border border-blue-200 dark:border-blue-800">Mesh: {m?.code}</span>}
                                                    </div>
                                                    <div className="ui-canvas-list-item-subtitle">
                                                        Category: {PART_CATEGORIES_BY_SECTOR[item.sector]?.[item.category] || item.category} • Sector: {item.sector} • Cost: €{item.cost?.toFixed(2) ?? "0.00"} / Price: €{item.price?.toFixed(2) ?? "0.00"}
                                                    </div>
                                                    <div className="ui-canvas-list-item-details">
                                                        <span>{item.isRentable ? '✅ Rentable' : '❌ Rentable'}</span>
                                                        <span>{item.isSellable ? '✅ Sellable' : '❌ Sellable'}</span>
                                                        <span>{item.isConsumable ? '♻️ Consumable' : '📦 Asset'} ({item.baseUnit})</span>
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
