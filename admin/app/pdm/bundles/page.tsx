"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Save, Layers, Box, GripVertical } from "lucide-react";
import BundleCanvasEditor from "./components/BundleCanvasEditor";
import { OrchestratorClient } from "../../lib/orchestratorClient";

// Local types
type LocalizedString = {
    it: string;
    en?: string;
    es?: string;
    de?: string;
};

type BundlePartNode = {
    id: string; // uuid generated locally
    partId: string;
    position: [number, number, number];
    rotation: [number, number, number];
};

type BundleProcessNode = {
    id: string;
    processId: string;
    quantity: number;
};


type BundleEntity = {
    id?: string;
    name: LocalizedString;
    locationType: "warehouse" | "site";
    parts?: BundlePartNode[];
    processes?: BundleProcessNode[];

    cost?: number;
    price?: number;
};

export default function CanvasBundlesAdminPage() {
    const [bundles, setBundles] = useState<BundleEntity[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<BundleEntity | null>(null);
    const [activeTab, setActiveTab] = useState<"general" | "canvas3d">("general");

    const [partDict, setPartDict] = useState<Record<string, { cost?: number, price?: number, name?: LocalizedString }>>({});
    const [processDict, setProcessDict] = useState<Record<string, { cost?: number, price?: number, name?: LocalizedString }>>({});
    const [dragInfo, setDragInfo] = useState<{ type: "parts" | "processes" | null, startIndex: number, overIndex: number }>({ type: null, startIndex: -1, overIndex: -1 });

    const loadData = async () => {
        setLoading(true);
        try {
            const bundlesData = await OrchestratorClient.list<BundleEntity>("bundle", { limit: 100 });
            const resultData = bundlesData || [];

            // Assume subcollections are not returned by the base list, so we might initialize empty arrays
            const enriched = resultData.map((a: BundleEntity) => ({
                ...a,
                parts: a.parts || [],
                processes: a.processes || []
            }));

            setBundles(enriched);

            // Fetch catalogues
            const fetchCatalog = async (entityId: string) => {
                const data = await OrchestratorClient.list<{ id: string, cost?: number, price?: number }>(entityId, { limit: 1000 });
                const dict: Record<string, { cost?: number, price?: number }> = {};
                (data || []).forEach(item => { dict[item.id] = item; });
                return dict;
            };

            const [pDict, prDict] = await Promise.all([
                fetchCatalog("part"),
                fetchCatalog("process")
            ]);

            setPartDict(pDict);
            setProcessDict(prDict);
        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const openEditor = async (item: BundleEntity | null) => {
        if (item) {
            if (item.id) {
                setLoading(true);
                try {
                    const details = await OrchestratorClient.getDetails<BundleEntity>("bundle", item.id);
                    if (details) {
                        setEditing({
                            ...details,
                            parts: details.parts || [],
                            processes: details.processes || []
                        });
                    }
                } catch (e) {
                    console.error("Failed to load details", e);
                    alert("Could not load bundle details.");
                } finally {
                    setLoading(false);
                }
            } else {
                setEditing({
                    ...item,
                    parts: item.parts || [],
                    processes: item.processes || []
                });
            }
        } else {
            setEditing({
                name: { it: "", en: "" },
                locationType: "warehouse",
                parts: [],
                processes: []
            });
        }
        setActiveTab("general");
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editing) return;

        try {
            const calculatedCost = (editing.parts || []).reduce((acc, p) => acc + (partDict[p.partId]?.cost || 0), 0) +
                (editing.processes || []).reduce((acc, p: BundleProcessNode) => acc + (processDict[p.processId]?.cost || 0) * (p.quantity || 1), 0);

            const calculatedPrice = (editing.parts || []).reduce((acc, p) => acc + (partDict[p.partId]?.price || 0), 0) +
                (editing.processes || []).reduce((acc, p: BundleProcessNode) => acc + (processDict[p.processId]?.price || 0) * (p.quantity || 1), 0);

            const payload = {
                ...editing,
                cost: calculatedCost,
                price: calculatedPrice
            };

            // Subcollections like parts might need manual handling on the backend
            // For now we just send them as part of the payload, though gateway might strip or ignore them.

            if (payload.id) {
                await OrchestratorClient.update("bundle", payload);
            } else {
                await OrchestratorClient.create("bundle", payload);
            }
            setEditing(null);
            loadData();
        } catch (e) {
            console.error(e);
            alert("Error saving bundle");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this Bundle?")) return;
        try {
            await OrchestratorClient.delete("bundle", id);
            loadData();
        } catch (e) { console.error(e); }
    };

    const calculatedCost = (editing?.parts || []).reduce((acc, p) => acc + (partDict[p.partId]?.cost || 0), 0) +
        (editing?.processes || []).reduce((acc, p: BundleProcessNode) => acc + (processDict[p.processId]?.cost || 0) * (p.quantity || 1), 0);

    const calculatedPrice = (editing?.parts || []).reduce((acc, p) => acc + (partDict[p.partId]?.price || 0), 0) +
        (editing?.processes || []).reduce((acc, p: BundleProcessNode) => acc + (processDict[p.processId]?.price || 0) * (p.quantity || 1), 0);

    const handleDragStart = (e: React.DragEvent, type: "parts" | "processes", index: number) => {
        setDragInfo({ type, startIndex: index, overIndex: index });
        if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    };

    const handleDragEnter = (e: React.DragEvent, type: "parts" | "processes", index: number) => {
        if (dragInfo.type === type && dragInfo.startIndex !== -1) {
            setDragInfo(prev => ({ ...prev, overIndex: index }));
        }
    };

    const handleDragEnd = () => {
        if (editing && dragInfo.type && dragInfo.startIndex !== -1 && dragInfo.overIndex !== -1 && dragInfo.startIndex !== dragInfo.overIndex) {
            const newList = [...(editing[dragInfo.type] || [])];
            const [draggedItem] = newList.splice(dragInfo.startIndex, 1);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            newList.splice(dragInfo.overIndex, 0, draggedItem as any);

            setEditing({ ...editing, [dragInfo.type]: newList });
        }
        setDragInfo({ type: null, startIndex: -1, overIndex: -1 });
    };

    return (
        <div className="ui-canvas-layout">
            <header className="ui-canvas-header">
                <h1 className="ui-canvas-title">
                    <span className="text-blue-600 dark:text-blue-400 mr-2">Bundles</span> Manager
                </h1>
                <p className="ui-canvas-description">
                    Manage hierarchical Bundles containing parts and sub-components.
                </p>
            </header>

            <div className="ui-canvas-grid">
                <div className="ui-canvas-panel">
                    <div className="ui-canvas-panel-header">
                        <div>
                            <h2 className="ui-canvas-panel-title">Bundles</h2>
                            <p className="ui-canvas-panel-subtitle">Collection: `bundles`</p>
                        </div>
                        <button onClick={() => openEditor(null)} className="ui-canvas-btn-primary">
                            <Plus className="w-4 h-4 mr-2" /> Add Bundle
                        </button>
                    </div>

                    <div className="ui-canvas-panel-content">
                        {editing ? (
                            <form onSubmit={handleSave} className="ui-canvas-form">
                                <div className="ui-canvas-form-header">
                                    <h3 className="ui-canvas-form-title">{editing.id ? "Edit Bundle" : "New Bundle"}</h3>
                                    <button type="button" onClick={() => openEditor(null)} className="ui-canvas-form-close"><X className="w-5 h-5" /></button>
                                </div>

                                <div className="ui-canvas-tabs">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("general")}
                                        className={activeTab === "general" ? "ui-canvas-tab-active" : "ui-canvas-tab-inactive"}
                                    >
                                        General
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("canvas3d")}
                                        className={activeTab === "canvas3d" ? "ui-canvas-tab-active" : "ui-canvas-tab-inactive"}
                                    >
                                        <Box className="w-4 h-4" /> Canvas 3D
                                    </button>
                                </div>

                                <div className="ui-canvas-scrollable-y">
                                    {activeTab === "general" && (
                                        <div className="space-y-6 pt-4">
                                            <div className="ui-canvas-form-grid">
                                                <div className="ui-canvas-form-col-1">
                                                    <label className="ui-canvas-label">Name (EN) *</label>
                                                    <input required value={editing.name.en || ""} onChange={e => setEditing({ ...editing, name: { ...editing.name, en: e.target.value } })} className="ui-canvas-input" />
                                                </div>

                                                <div className="ui-canvas-form-col-1">
                                                    <label className="ui-canvas-label">Location Type *</label>
                                                    <select required value={editing.locationType} onChange={e => setEditing({ ...editing, locationType: e.target.value as "warehouse" | "site" })} className="ui-canvas-select">
                                                        <option value="warehouse">Warehouse</option>
                                                        <option value="site">Site</option>
                                                    </select>
                                                </div>

                                                <div className="ui-canvas-form-col-1">
                                                    <label className="ui-canvas-label text-green-600 dark:text-green-500">Cost (€) - Auto-calculated</label>
                                                    <input readOnly type="number" step="0.01" value={calculatedCost || ""} className="ui-canvas-input bg-muted/50 focus:outline-none cursor-not-allowed" />
                                                </div>

                                                <div className="ui-canvas-form-col-1">
                                                    <label className="ui-canvas-label ui-canvas-text-blue">Price (€) - Auto-calculated</label>
                                                    <input readOnly type="number" step="0.01" value={calculatedPrice || ""} className="ui-canvas-input bg-muted/50 focus:outline-none cursor-not-allowed" />
                                                </div>
                                            </div>

                                            <div className="ui-canvas-subcollection">
                                                <h4 className="ui-canvas-subcollection-title">
                                                    Parts List
                                                    <span className="ui-canvas-subcollection-badge">{editing.parts?.length || 0} items</span>
                                                </h4>
                                                {editing.parts && editing.parts.length > 0 ? (
                                                    <ul className="ui-canvas-subcollection-list">
                                                        {editing.parts.map((part, index) => {
                                                            const partDetails = partDict[part.partId];
                                                            const isDragging = dragInfo.type === "parts" && dragInfo.startIndex === index;
                                                            const isOver = dragInfo.type === "parts" && dragInfo.overIndex === index;
                                                            const dropClass = isOver && dragInfo.startIndex !== index ? (dragInfo.startIndex < index ? "border-b-2 border-primary" : "border-t-2 border-primary") : "";

                                                            return (
                                                                <li
                                                                    key={part.id}
                                                                    draggable
                                                                    onDragStart={(e) => handleDragStart(e, "parts", index)}
                                                                    onDragEnter={(e) => handleDragEnter(e, "parts", index)}
                                                                    onDragEnd={handleDragEnd}
                                                                    onDragOver={(e) => e.preventDefault()}
                                                                    className={`ui-canvas-subcollection-item flex justify-between items-center w-full transition-opacity ${isDragging ? "opacity-40" : ""} ${dropClass}`}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium text-sm">Part: {partDetails?.name?.en || part.partId}</span>
                                                                        <span className="text-xs text-muted-foreground mt-1">
                                                                            <span className="text-green-600 dark:text-green-500 mr-2">Cost: €{partDetails?.cost?.toFixed(2) || "0.00"}</span>
                                                                            <span className="text-blue-600 dark:text-blue-400 mr-2">Price: €{partDetails?.price?.toFixed(2) || "0.00"}</span>
                                                                            <span>Pos: [{part.position.map(n => n.toFixed(2)).join(", ")}]</span>
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center space-x-1">
                                                                        <button type="button" onClick={() => setEditing({ ...editing, parts: editing.parts?.filter(p => p.id !== part.id) })} className="ui-canvas-btn-icon-danger">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                        <div className="text-muted-foreground/50 hover:text-foreground cursor-grab active:cursor-grabbing p-1">
                                                                            <GripVertical className="w-4 h-4" />
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                ) : (
                                                    <p className="ui-canvas-subcollection-empty">No parts added yet. Switch to Canvas 3D to place parts.</p>
                                                )}
                                            </div>

                                            <div className="ui-canvas-subcollection">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="ui-canvas-subcollection-title mb-0">
                                                        Processes List
                                                        <span className="ui-canvas-subcollection-badge ml-2">{editing.processes?.length || 0} items</span>
                                                    </h4>
                                                    <select
                                                        className="ui-canvas-select text-sm py-1 w-48"
                                                        value=""
                                                        onChange={(e) => {
                                                            if (!e.target.value) return;
                                                            const newProcess: BundleProcessNode = { id: crypto.randomUUID(), processId: e.target.value, quantity: 1 };
                                                            setEditing({ ...editing, processes: [...(editing.processes || []), newProcess] });
                                                        }}
                                                    >
                                                        <option value="">+ Add Process</option>
                                                        {Object.keys(processDict).map(k => (
                                                            <option key={k} value={k}>{processDict[k].name?.en || k}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {editing.processes && editing.processes.length > 0 ? (
                                                    <ul className="ui-canvas-subcollection-list">
                                                        {editing.processes.map((proc, index) => {
                                                            const procDetails = processDict[proc.processId];
                                                            const isDragging = dragInfo.type === "processes" && dragInfo.startIndex === index;
                                                            const isOver = dragInfo.type === "processes" && dragInfo.overIndex === index;
                                                            const dropClass = isOver && dragInfo.startIndex !== index ? (dragInfo.startIndex < index ? "border-b-2 border-primary" : "border-t-2 border-primary") : "";

                                                            return (
                                                                <li
                                                                    key={proc.id}
                                                                    draggable
                                                                    onDragStart={(e) => handleDragStart(e, "processes", index)}
                                                                    onDragEnter={(e) => handleDragEnter(e, "processes", index)}
                                                                    onDragEnd={handleDragEnd}
                                                                    onDragOver={(e) => e.preventDefault()}
                                                                    className={`ui-canvas-subcollection-item flex justify-between items-center w-full transition-opacity ${isDragging ? "opacity-40" : ""} ${dropClass}`}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium text-sm">{procDetails?.name?.en || proc.processId}</span>
                                                                        <span className="text-xs text-muted-foreground mt-1">
                                                                            <span className="text-green-600 dark:text-green-500 mr-2">Cost/u: €{procDetails?.cost?.toFixed(2) || "0.00"}</span>
                                                                            <span className="text-blue-600 dark:text-blue-400 mr-2">Price/u: €{procDetails?.price?.toFixed(2) || "0.00"}</span>
                                                                            <span>Qty: <input type="number" min="1" className="w-12 bg-background border px-1 rounded" value={proc.quantity} onChange={e => {
                                                                                const np = [...editing.processes!];
                                                                                np[index].quantity = parseInt(e.target.value) || 1;
                                                                                setEditing({ ...editing, processes: np });
                                                                            }} /></span>
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center space-x-1">
                                                                        <button type="button" onClick={() => setEditing({ ...editing, processes: editing.processes?.filter(p => p.id !== proc.id) })} className="ui-canvas-btn-icon-danger">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                        <div className="text-muted-foreground/50 hover:text-foreground cursor-grab active:cursor-grabbing p-1">
                                                                            <GripVertical className="w-4 h-4" />
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                ) : (
                                                    <p className="ui-canvas-subcollection-empty">No processes added yet. Select one from the dropdown.</p>
                                                )}
                                            </div>

                                        </div>
                                    )}

                                    {activeTab === "canvas3d" && (
                                        <div className="ui-canvas-form-editor-container h-full min-h-[500px] border border-border rounded-md bg-black/5 relative flex flex-col">
                                            <BundleCanvasEditor
                                                parts={editing.parts || []}
                                                onChangeParts={(newParts: BundlePartNode[]) => setEditing({ ...editing, parts: newParts })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="ui-canvas-form-actions">
                                    <button type="submit" className="ui-canvas-btn-success shadow-md px-6">
                                        <Save className="w-4 h-4 mr-2" /> Save Bundle
                                    </button>
                                </div>
                            </form>
                        ) : loading ? (
                            <div className="ui-canvas-loading">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : (
                            <table className="ui-table">
                                <thead className="ui-table-thead">
                                    <tr>
                                        <th className="ui-table-th">Name</th>
                                        <th className="ui-table-th">Location</th>
                                        <th className="ui-table-th">Parts Count</th>
                                        <th className="ui-table-th">Cost (€)</th>
                                        <th className="ui-table-th">Price (€)</th>
                                        <th className="ui-table-th text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="ui-table-tbody">
                                    {bundles.map(bundle => (
                                        <tr key={bundle.id} className="ui-table-tr">
                                            <td className="ui-table-td font-medium">
                                                <div className="ui-canvas-flex-start">
                                                    <Layers className="w-4 h-4 mr-2 ui-canvas-text-blue" />
                                                    {bundle.name.en || "Unnamed"}
                                                </div>
                                            </td>
                                            <td className="ui-table-td capitalize">{bundle.locationType}</td>
                                            <td className="ui-table-td">{bundle.parts?.length || 0}</td>
                                            <td className="ui-table-td">{bundle.cost?.toFixed(2) ?? "0.00"}</td>
                                            <td className="ui-table-td">{bundle.price?.toFixed(2) ?? "0.00"}</td>
                                            <td className="ui-table-td text-right">
                                                <button onClick={() => openEditor(bundle)} className="ui-canvas-btn-icon mr-2">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => bundle.id && handleDelete(bundle.id)} className="ui-canvas-btn-icon-danger">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {bundles.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="ui-table-empty">
                                                No bundles found. Create one.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
