"use client";

import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Box, Environment, Text } from "@react-three/drei";
import { Cuboid } from "lucide-react";
import { OrchestratorClient } from "../../lib/orchestratorClient";

type EntityType = "mesh" | "part" | "assembly" | "stand";

export default function CanvasViewerPage() {
    const [entityType, setEntityType] = useState<EntityType>("mesh");
    const [items, setItems] = useState<Record<string, unknown>[]>([]);
    const [selectedId, setSelectedId] = useState<string>("");
    const [selectedEntity, setSelectedEntity] = useState<Record<string, unknown> | null>(null);
    const [loading, setLoading] = useState(false);

    const [meshCache, setMeshCache] = useState<Record<string, unknown>>({});
    const [materials, setMaterials] = useState<Record<string, unknown>[]>([]);

    useEffect(() => {
        const loadMats = async () => {
            try {
                const res = await fetch("/admin/api/registry/materials");
                const json = await res.json();
                setMaterials(json.data || []);
            } catch (e) { console.error(e); }
        };
        loadMats();
    }, []);

    const loadItems = async (type: EntityType) => {
        setLoading(true);
        setItems([]);
        setSelectedId("");
        setSelectedEntity(null);
        try {
            const data = await OrchestratorClient.list<Record<string, unknown>>(type, { limit: 100 });
            setItems(data || []);
        } catch (e) {
            console.error("Failed to load items", e);
        } finally {
            setLoading(false);
        }
    };

    // Helper to fetch a single mesh to render a part's geometry
    const [meshError, setMeshError] = useState<string | null>(null);

    const loadMesh = async (meshId: string) => {
        if (meshCache[meshId]) return;
        setMeshError(null);
        try {
            const data = await OrchestratorClient.read<Record<string, unknown>>("mesh", meshId);
            if (data) {
                setMeshCache(prev => ({ ...prev, [meshId]: data }));
            } else {
                setMeshError("Mesh not found or invalid format");
            }
        } catch (e: unknown) {
            console.error(e);
            setMeshError((e as Error).message || "Network error loading mesh");
        }
    };

    useEffect(() => {
        loadItems(entityType);
    }, [entityType]);

    useEffect(() => {
        if (selectedId) {
            const ent = items.find(i => i.id === selectedId);
            setSelectedEntity(ent || null);
            // If it's a part, aggressively pre-load its mesh
            if (entityType === "part" && ent?.meshId) {
                loadMesh(ent.meshId as string);
            }
        } else {
            setSelectedEntity(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId, items, entityType]);

    // Simple Renderers based on generic extraction of dimensions
    const renderMesh = (mesh: Record<string, unknown>, position: [number, number, number] = [0, 0, 0], renderText: string = "") => {
        if (!mesh) return null;
        const dims = (mesh.dimensions as number[]) || [1, 1, 1];

        let color = "#cccccc";
        let roughness = 0.5;
        let metalness = 0;

        if (mesh.materialId) {
            const mat = materials.find(m => m.id === mesh.materialId);
            if (mat) {
                color = (mat.baseColor as string) || color;
                roughness = (mat.roughness as number) ?? roughness;
                metalness = (mat.metalness as number) ?? metalness;
            }
        }

        return (
            <group position={position}>
                <Box args={[dims[0], dims[2], dims[1]]}>
                    <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
                </Box>
                {renderText && (
                    <Text position={[0, dims[2] / 2 + 0.1, 0]} fontSize={0.2} color="black">
                        {renderText}
                    </Text>
                )}
            </group>
        );
    };

    const renderEntity = () => {
        if (!selectedEntity) return null;

        switch (entityType) {
            case "mesh":
                return renderMesh(selectedEntity, [0, 0, 0], (selectedEntity.code as string) || "");
            case "part":
                if (selectedEntity.gltfUrl) {
                    return (
                        <Text position={[0, 1, 0]} fontSize={0.4} color="purple">
                            [GLTF Model loaded from: {selectedEntity.gltfUrl as string}]
                        </Text>
                    );
                } else if (selectedEntity.meshId) {
                    const mId = selectedEntity.meshId as string;
                    if (meshCache[mId]) {
                        return renderMesh(meshCache[mId] as Record<string, unknown>, (selectedEntity.position as [number, number, number]) || [0, 0, 0], (selectedEntity.name as string) || "Part");
                    }
                    if (meshError) return <Text position={[0, 0, 0]} fontSize={0.3} color="red">Error: {meshError}</Text>;
                    return <Text position={[0, 0, 0]} fontSize={0.3} color="orange">Loading geometry...</Text>;
                }
                return <Text position={[0, 0, 0]} fontSize={0.3} color="orange">No geometry linked</Text>;
            case "assembly":
                return <Text position={[0, 0, 0]} fontSize={0.3} color="blue">Assembly Viewer (Pending recursive render)</Text>;
            case "stand":
                return <Text position={[0, 0, 0]} fontSize={0.3} color="red">Stand Viewer (Pending scene graph render)</Text>;
            default:
                return null;
        }
    };

    return (
        <div className="ui-canvas-viewer-layout">
            {/* Sidebar for Selection */}
            <div className="ui-canvas-sidebar">
                <h2 className="ui-canvas-sidebar-title">
                    <Cuboid className="w-5 h-5 text-primary" />
                    Entity Explorer
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="ui-canvas-sidebar-label">Entity Level</label>
                        <select
                            value={entityType}
                            onChange={e => setEntityType(e.target.value as EntityType)}
                            className="ui-canvas-sidebar-select"
                        >
                            <option value="mesh">Level 0: Mesh (Geometry)</option>
                            <option value="part">Level 1: Part (Product)</option>
                            <option value="assembly">Level 2: Assembly (Group)</option>
                            <option value="stand">Level 3: Stand (Root)</option>
                        </select>
                    </div>

                    <div>
                        <label className="ui-canvas-sidebar-label">Select Item</label>
                        <select
                            value={selectedId}
                            onChange={e => setSelectedId(e.target.value)}
                            disabled={loading || items.length === 0}
                            className="ui-canvas-sidebar-select"
                        >
                            <option value="">{loading ? "Loading..." : "-- Select --"}</option>
                            {items.map(i => {
                                const id = i.id as string;
                                const n = i.name as Record<string, string> | string;
                                const nameStr = typeof n === "object" ? (n?.it || "Unnamed") : (n || "Unnamed");
                                return (
                                    <option key={id} value={id}>
                                        {entityType === "mesh" ? (i.code as string) : nameStr}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>

                <div className="ui-canvas-sidebar-footer">
                    <div className="ui-canvas-sidebar-footer-title">Raw Inspector</div>
                    <pre className="ui-canvas-sidebar-footer-pre">
                        {selectedEntity ? JSON.stringify(selectedEntity, null, 2) : "// No entity selected"}
                    </pre>
                </div>
            </div>

            {/* 3D Canvas */}
            <div className="ui-canvas-main">
                <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
                    <color attach="background" args={["#f8fafc"]} />
                    {/* Dark mode fallback check for background could be added dynamically if needed */}
                    <OrbitControls makeDefault />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                    <Environment preset="city" />

                    {renderEntity()}

                    <gridHelper args={[20, 20]} position={[0, -0.01, 0]} />
                    {/* Center Axis Marker */}
                    <axesHelper args={[2]} />
                </Canvas>

                {!selectedEntity && (
                    <div className="ui-canvas-empty-state">
                        <div className="ui-canvas-empty-state-card">
                            <Cuboid className="ui-canvas-empty-state-icon" />
                            <h3 className="ui-canvas-empty-state-title">No Entity Rendered</h3>
                            <p className="ui-canvas-empty-state-desc">Select an item from the sidebar to visualize</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
