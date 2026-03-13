"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Grid, TransformControls, Box, Html, GizmoHelper, PerspectiveCamera, OrthographicCamera, Edges } from "@react-three/drei";
import { ZUpGizmoViewcube } from "./ZUpGizmoViewcube";
import { Plus, Move, RotateCw, Search, X, Home, Magnet, Copy } from "lucide-react";
import { OrchestratorClient } from "../../../lib/orchestratorClient";

const MutedAxes = () => {
    const axesRef = useRef<THREE.AxesHelper>(null);
    useEffect(() => {
        if (axesRef.current) {
            // Muted colors for X, Y, Z axes
            axesRef.current.setColors(
                new THREE.Color('#ef4444').multiplyScalar(0.6), // Red muted
                new THREE.Color('#22c55e').multiplyScalar(0.6), // Green muted
                new THREE.Color('#3b82f6').multiplyScalar(0.6)  // Blue muted
            );
        }
    }, []);
    return <axesHelper ref={axesRef} args={[2]} />;
};

export type BundlePartNode = {
    id: string;
    partId: string;
    position: [number, number, number];
    rotation: [number, number, number];
};

type BundleCanvasEditorProps = {
    parts: BundlePartNode[];
    onChangeParts: (parts: BundlePartNode[]) => void;
};

type PartEntity = {
    id: string;
    code: string;
    name: string;
    meshId?: string;
    cost?: number;
    price?: number;
};

type MeshEntity = {
    id: string;
    code: string;
    dimensions: [number, number, number];
    materialId?: string;
};

type MaterialEntity = {
    id: string;
    baseColor: string;
    roughness?: number;
    metalness?: number;
};

// Helper per generare ID sicuri senza dipendere da crypto.randomUUID (che può fallire in HTTP o alcuni contesti client)
const generateLocalId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export default function BundleCanvasEditor({ parts, onChangeParts }: BundleCanvasEditorProps) {
    const [availableParts, setAvailableParts] = useState<PartEntity[]>([]);
    const [meshCache, setMeshCache] = useState<Record<string, MeshEntity>>({});
    const [materialCache, setMaterialCache] = useState<Record<string, MaterialEntity>>({});

    // For tracking which part is actively being transformed
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "snap">("translate");
    const [cameraMode, setCameraMode] = useState<"perspective" | "orthographic" | "ortho_faces">("perspective");
    const [shadingMode, setShadingMode] = useState<"shaded" | "shaded_edges" | "white_edges">("shaded");

    // Snap mechanics state
    const [hoverSnap, setHoverSnap] = useState<{ id: string; point: THREE.Vector3; normal: THREE.Vector3; type: 'corner' | 'midpoint' | 'origin' } | null>(null);
    const [snapSource, setSnapSource] = useState<{ id: string; point: THREE.Vector3; normal: THREE.Vector3; type: 'corner' | 'midpoint' | 'origin' } | null>(null);

    // Search / Auto-complete
    const [searchTerm, setSearchTerm] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const controlsRef = useRef<any>(null);

    useEffect(() => {
        // Load global dependencies: all parts and materials
        const loadGlobals = async () => {
            try {
                // 1. Fetch materials locally
                const resMat = await fetch("/admin/api/registry/materials");
                if (resMat.ok) {
                    const matsJson = await resMat.json();
                    const mats = matsJson.data || matsJson || [];
                    const matMap: Record<string, MaterialEntity> = {};
                    if (Array.isArray(mats)) {
                        mats.forEach((m: Record<string, unknown>) => matMap[m.id as string] = m as unknown as MaterialEntity);
                    }
                    setMaterialCache(matMap);
                }

                // 2. Fetch all parts
                const partsData = await OrchestratorClient.list<PartEntity>("part", { limit: 1000 });
                if (partsData) {
                    setAvailableParts(partsData);
                }
            } catch (e) {
                console.error("Failed loading globals", e);
            }
        };
        loadGlobals();
    }, []);

    // Effect to aggressively load missing meshes for any part currently in the bundle
    useEffect(() => {
        const loadMissingMeshes = async () => {
            for (const node of parts) {
                const partDef = availableParts.find(p => p.id === node.partId);
                if (partDef && partDef.meshId && !meshCache[partDef.meshId]) {
                    try {
                        const data = await OrchestratorClient.read<MeshEntity>("mesh", partDef.meshId);
                        if (data) {
                            setMeshCache(prev => ({ ...prev, [partDef.meshId as string]: data }));
                        }
                    } catch (e) { console.error(e); }
                }
            }
        };
        if (availableParts.length > 0 && parts.length > 0) {
            loadMissingMeshes();
        }
    }, [parts, availableParts, meshCache]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            const key = e.key.toLowerCase();
            if (key === 'p') setTransformMode('translate');
            if (key === 'r') setTransformMode('rotate');
            if (key === 's') setTransformMode('snap');
            if (key === 'escape') setSnapSource(null);

            if (key === 'd' && selectedNodeId) {
                e.preventDefault();
                const selectedNode = parts.find(p => p.id === selectedNodeId);
                if (selectedNode) {
                    const newPart = {
                        id: generateLocalId(),
                        partId: selectedNode.partId,
                        position: [selectedNode.position[0] + 0.5, selectedNode.position[1] + 0.5, selectedNode.position[2]] as [number, number, number],
                        rotation: [...selectedNode.rotation] as [number, number, number]
                    };
                    onChangeParts([...parts, newPart]);
                    setSelectedNodeId(newPart.id);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId, parts, onChangeParts]);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAddPart = (partId: string) => {
        // Offset new parts so they don't perfectly overlap
        const offset = parts.length > 0 ? parts.length * 0.5 : 0;

        const newPart = {
            id: generateLocalId(),
            partId: partId,
            position: [offset, 0, 0] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number]
        };
        onChangeParts([...parts, newPart]);
        setSelectedNodeId(newPart.id);
        setSearchTerm("");
        setShowSuggestions(false);
    };

    const handleTransformEnd = (id: string, newPos: [number, number, number], newRot: [number, number, number]) => {
        const updated = parts.map(p => {
            if (p.id === id) {
                // Round values lightly to avoid float precision UI bugs and snap cleanly
                const cleanPos = newPos.map(v => Math.round(v * 1000) / 1000) as [number, number, number];
                // Use absolute normal alignment instead of rounding the euler rotations exactly in snap mode sometimes, but since this fires on snap end too, we'll keep it for typical transforms
                const cleanRot = newRot.map(v => Number.isNaN(v) ? 0 : Math.round(v * 100000) / 100000) as [number, number, number];
                return { ...p, position: cleanPos, rotation: cleanRot };
            }
            return p;
        });
        onChangeParts(updated);
    };

    const executeSnap = (source: { id: string; point: THREE.Vector3; normal: THREE.Vector3 }, target: { id: string; point: THREE.Vector3; normal: THREE.Vector3 }) => {
        const node = parts.find(p => p.id === source.id);
        if (!node) return;

        const pA = source.point.clone();
        const pB = target.point.clone();

        // ONLY Translation
        const translation = pB.clone().sub(pA);
        const center = new THREE.Vector3(...node.position);
        const newPos = center.clone().add(translation);

        handleTransformEnd(
            node.id,
            [newPos.x, newPos.y, newPos.z],
            node.rotation
        );
    };

    // Suggest up to 10 parts
    const filteredParts = availableParts
        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(0, 10);

    return (
        <div className="w-full h-full min-h-[400px] flex flex-col bg-background relative border rounded-md overflow-hidden">
            {/* Toolbar */}
            <div className="ui-canvas-editor-toolbar">

                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm" ref={searchRef}>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Cerca parte da aggiungere..."
                            className="ui-canvas-editor-search-input"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                        />
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        {searchTerm && (
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchTerm("")}>
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && searchTerm && (
                        <div className="ui-canvas-editor-dropdown">
                            {filteredParts.length > 0 ? (
                                <ul className="py-1">
                                    {filteredParts.map(p => (
                                        <li
                                            key={p.id}
                                            className="ui-canvas-editor-dropdown-item group"
                                            onClick={() => handleAddPart(p.id)}
                                        >
                                            <span className="font-medium text-foreground">{p.name}</span>
                                            <span className="text-xs text-muted-foreground font-mono">{p.code}</span>
                                            <button className="hidden group-hover:flex bg-blue-600 text-white rounded w-5 h-5 items-center justify-center">
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-3 text-sm text-muted-foreground text-center">Nessuna parte trovata</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Transform Mode Toggles */}
                <div className="ui-canvas-editor-toggle-group">
                    <button
                        type="button"
                        onClick={() => setTransformMode("translate")}
                        className={transformMode === "translate" ? "ui-canvas-editor-toggle-btn-active" : "ui-canvas-editor-toggle-btn"}
                        title="Sposta (P)"
                    >
                        <Move className="w-4 h-4" /> Sposta
                    </button>
                    <button
                        type="button"
                        onClick={() => setTransformMode("rotate")}
                        className={transformMode === "rotate" ? "ui-canvas-editor-toggle-btn-active" : "ui-canvas-editor-toggle-btn"}
                        title="Ruota (R)"
                    >
                        <RotateCw className="w-4 h-4" /> Ruota
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setTransformMode("snap");
                            setHoverSnap(null);
                            setSnapSource(null);
                        }}
                        className={transformMode === "snap" ? "ui-canvas-editor-toggle-btn-active" : "ui-canvas-editor-toggle-btn"}
                        title="Calamita (S)"
                    >
                        <Magnet className="w-4 h-4" /> Allinea
                    </button>
                    <div className="w-px h-6 bg-border mx-1" />
                    <button
                        type="button"
                        onClick={() => {
                            if (selectedNodeId) {
                                const selectedNode = parts.find(p => p.id === selectedNodeId);
                                if (selectedNode) {
                                    const newPart = {
                                        id: generateLocalId(),
                                        partId: selectedNode.partId,
                                        position: [selectedNode.position[0] + 0.5, selectedNode.position[1] + 0.5, selectedNode.position[2]] as [number, number, number],
                                        rotation: [...selectedNode.rotation] as [number, number, number]
                                    };
                                    onChangeParts([...parts, newPart]);
                                    setSelectedNodeId(newPart.id);
                                }
                            }
                        }}
                        disabled={!selectedNodeId}
                        className={`ui-canvas-editor-toggle-btn ${!selectedNodeId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Duplica (D)"
                    >
                        <Copy className="w-4 h-4" /> Duplica
                    </button>
                </div>

                {/* View Controls Group */}
                <div className="ui-canvas-editor-toggle-group ml-auto">
                    <select
                        value={cameraMode}
                        onChange={(e) => setCameraMode(e.target.value as "perspective" | "orthographic" | "ortho_faces")}
                        className="ui-canvas-editor-select"
                    >
                        <option value="perspective">Prospettiva</option>
                        <option value="orthographic">Ortogonale</option>
                        <option value="ortho_faces">Prosp+Orto</option>
                    </select>
                    <div className="w-px h-6 bg-border mx-1" />
                    <select
                        value={shadingMode}
                        onChange={(e) => setShadingMode(e.target.value as "shaded" | "shaded_edges" | "white_edges")}
                        className="ui-canvas-editor-select"
                    >
                        <option value="shaded">Normale</option>
                        <option value="shaded_edges">Bordi</option>
                        <option value="white_edges">Bianco</option>
                    </select>
                </div>
            </div>

            {/* Canvas - Light background mode */}
            <div className="ui-canvas-editor-canvas-container">
                <Canvas
                    onPointerMissed={() => setSelectedNodeId(null)}
                >
                    {cameraMode === "orthographic" ? (
                        <OrthographicCamera makeDefault position={[5, 5, 5]} zoom={50} near={-100} far={100} />
                    ) : (
                        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} near={0.1} far={1000} />
                    )}
                    <ambientLight intensity={0.6} />
                    <directionalLight position={[10, 5, 10]} intensity={1} />
                    <directionalLight position={[-10, 5, -10]} intensity={0.5} />

                    <Grid infiniteGrid fadeDistance={20} sectionColor="#94a3b8" cellColor="#cbd5e1" />
                    <MutedAxes />

                    {/* World Origin Snap Target */}
                    {transformMode === "snap" && (
                        <group
                            position={[0, 0, 0]}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!hoverSnap) return;
                                if (!snapSource) {
                                    setSnapSource(hoverSnap);
                                } else {
                                    if (snapSource.id === hoverSnap.id) {
                                        setSnapSource(null);
                                        return;
                                    }
                                    executeSnap(snapSource, hoverSnap);
                                    setSnapSource(null);
                                    setHoverSnap(null);
                                    setTransformMode('translate');
                                }
                            }}
                            onPointerMove={(e) => {
                                e.stopPropagation();
                                setHoverSnap({
                                    id: 'world-origin',
                                    point: new THREE.Vector3(0, 0, 0),
                                    normal: new THREE.Vector3(0, 0, 1),
                                    type: 'origin'
                                });
                            }}
                            onPointerOver={(e) => {
                                e.stopPropagation();
                                document.body.style.cursor = 'crosshair';
                            }}
                            onPointerOut={() => {
                                setHoverSnap(null);
                                document.body.style.cursor = 'auto';
                            }}
                        >
                            <mesh visible={false}>
                                <boxGeometry args={[0.5, 0.5, 0.5]} />
                                <meshBasicMaterial />
                            </mesh>
                        </group>
                    )}

                    {/* Snap Indicators */}
                    {transformMode === "snap" && hoverSnap && (
                        <group position={hoverSnap.point} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), hoverSnap.normal)}>
                            {hoverSnap.type === 'corner' || hoverSnap.type === 'origin' ? (
                                <mesh>
                                    <sphereGeometry args={[snapSource?.id === hoverSnap.id ? 0.025 : 0.015, 16, 16]} />
                                    <meshBasicMaterial color={snapSource?.id === hoverSnap.id ? "#ef4444" : "#ffffff"} />
                                </mesh>
                            ) : (
                                <mesh>
                                    <circleGeometry args={[0.03, 3]} />
                                    <meshBasicMaterial color={snapSource?.id === hoverSnap.id ? "#ef4444" : "#ffffff"} side={THREE.DoubleSide} />
                                </mesh>
                            )}
                        </group>
                    )}
                    {transformMode === "snap" && snapSource && (
                        <group position={snapSource.point} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), snapSource.normal)}>
                            {snapSource.type === 'corner' || snapSource.type === 'origin' ? (
                                <mesh>
                                    <sphereGeometry args={[0.025, 16, 16]} />
                                    <meshBasicMaterial color="#ef4444" opacity={0.8} transparent />
                                </mesh>
                            ) : (
                                <mesh>
                                    <circleGeometry args={[0.04, 3]} />
                                    <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} opacity={0.8} transparent />
                                </mesh>
                            )}
                        </group>
                    )}

                    <Suspense fallback={<Html><div className="text-zinc-800 dark:text-gray-200 text-xs font-medium bg-white/50 px-2 py-1 rounded backdrop-blur">Caricamento 3D...</div></Html>}>
                        {parts.map((node) => {
                            const partDef = availableParts.find(p => p.id === node.partId);
                            const meshDef = partDef?.meshId ? meshCache[partDef.meshId] : null;

                            let color = "#cccccc";
                            let roughness = 0.5;
                            let metalness = 0;
                            const dims = meshDef?.dimensions || [0.5, 0.5, 0.5];

                            if (meshDef?.materialId && materialCache[meshDef.materialId]) {
                                const mat = materialCache[meshDef.materialId];
                                color = mat.baseColor || color;
                                roughness = mat.roughness ?? roughness;
                                metalness = mat.metalness ?? metalness;
                            }

                            const isSelected = selectedNodeId === node.id;

                            // We render a single meshStandardMaterial but inject emissive if selected.
                            // To ensure proper overlap handling, we use event.stopPropagation() carefully.

                            const handleSnapInteractionMove = (e: ThreeEvent<MouseEvent>) => {
                                if (transformMode !== 'snap') return;
                                e.stopPropagation();

                                const obj = e.object;
                                const localPoint = obj.worldToLocal(e.point.clone());

                                const snapToNearest = (val: number, extent: number) => {
                                    const half = extent / 2;
                                    const options = [-half, 0, half];
                                    let closest = options[0];
                                    let minDist = Math.abs(val - closest);
                                    for (const opt of options) {
                                        const d = Math.abs(val - opt);
                                        if (d < minDist) {
                                            minDist = d;
                                            closest = opt;
                                        }
                                    }
                                    return closest;
                                };

                                const sx = snapToNearest(localPoint.x, dims[0]);
                                const sy = snapToNearest(localPoint.y, dims[2]);
                                const sz = snapToNearest(localPoint.z, dims[1]);

                                const isMidpoint = Math.abs(sx) < 1e-4 || Math.abs(sy) < 1e-4 || Math.abs(sz) < 1e-4;
                                const pointType: 'corner' | 'midpoint' = isMidpoint ? 'midpoint' : 'corner';

                                const snappedLocal = new THREE.Vector3(sx, sy, sz);
                                const snappedWorld = obj.localToWorld(snappedLocal.clone());

                                const normalLocal = e.face?.normal || new THREE.Vector3(0, 1, 0);
                                // The normal needs to be transformed by the rotation matrix
                                const normalMat = new THREE.Matrix3().getNormalMatrix(obj.matrixWorld);
                                const normalWorld = normalLocal.clone().applyMatrix3(normalMat).normalize();

                                setHoverSnap({
                                    id: node.id,
                                    point: snappedWorld,
                                    normal: normalWorld,
                                    type: pointType
                                });
                            };

                            const handleSnapInteractionClick = (e: ThreeEvent<MouseEvent>) => {
                                if (transformMode !== 'snap') return;
                                e.stopPropagation();
                                if (!hoverSnap) return;

                                if (!snapSource) {
                                    // Set Origin Source
                                    setSnapSource(hoverSnap);
                                } else {
                                    if (snapSource.id === hoverSnap.id) {
                                        // Cannot snap to self or cancel
                                        setSnapSource(null);
                                        return;
                                    }
                                    // Target acquired - Execute transform
                                    executeSnap(snapSource, hoverSnap);
                                    setSnapSource(null);
                                    setHoverSnap(null);
                                    setTransformMode('translate'); // Auto switch back
                                }
                            };

                            return isSelected && transformMode !== 'snap' ? (
                                <TransformControls
                                    key={node.id}
                                    mode={transformMode}
                                    position={node.position}
                                    rotation={node.rotation}
                                    translationSnap={0.05} // Snap every 5cm
                                    rotationSnap={Math.PI / 12} // Snap to 15 degrees
                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                    onMouseUp={(e: any) => {
                                        const obj = e?.target?.object;
                                        if (obj) {
                                            handleTransformEnd(
                                                node.id,
                                                [obj.position.x, obj.position.y, obj.position.z],
                                                [obj.rotation.x, obj.rotation.y, obj.rotation.z]
                                            );
                                        }
                                    }}
                                >
                                    <group
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                        onPointerOver={(e) => {
                                            e.stopPropagation();
                                        }}
                                        onPointerOut={() => {
                                            document.body.style.cursor = 'auto';
                                        }}
                                    >
                                        <Box args={[dims[0], dims[2], dims[1]]}>
                                            <meshStandardMaterial color={shadingMode === 'white_edges' ? "#ffffff" : color} roughness={roughness} metalness={metalness} emissive="#3b82f6" emissiveIntensity={0.3} />
                                            {shadingMode !== "shaded" && <Edges threshold={15} color="black" />}
                                        </Box>
                                    </group>
                                </TransformControls>
                            ) : (
                                <group
                                    key={node.id}
                                    position={node.position}
                                    rotation={node.rotation}
                                    onClick={(e) => {
                                        if (transformMode === 'snap') {
                                            handleSnapInteractionClick(e);
                                        } else {
                                            e.stopPropagation();
                                            setSelectedNodeId(node.id);
                                        }
                                    }}
                                    onPointerMove={(e) => {
                                        if (transformMode === 'snap') {
                                            handleSnapInteractionMove(e);
                                        }
                                    }}
                                    onPointerOver={(e) => {
                                        e.stopPropagation();
                                        if (transformMode === 'snap') {
                                            document.body.style.cursor = 'crosshair';
                                        } else {
                                            document.body.style.cursor = 'pointer';
                                        }
                                    }}
                                    onPointerOut={() => {
                                        if (transformMode === 'snap') {
                                            setHoverSnap(null);
                                        }
                                        document.body.style.cursor = 'auto';
                                    }}
                                >
                                    <Box args={[dims[0], dims[2], dims[1]]}>
                                        <meshStandardMaterial color={shadingMode === 'white_edges' ? "#ffffff" : color} roughness={roughness} metalness={metalness} emissive={isSelected ? "#a855f7" : "#000000"} emissiveIntensity={isSelected ? 0.3 : 0} />
                                        {shadingMode !== "shaded" && <Edges threshold={15} color="black" />}
                                    </Box>
                                </group>
                            );
                        })}
                    </Suspense>

                    <GizmoHelper alignment="top-right" margin={[60, 60]}>
                        <ZUpGizmoViewcube
                            faces={['Destra', 'Sin.', 'Fronte', 'Dietro', 'Sopra', 'Sotto']}
                            color="#f4f4f5"
                            hoverColor="#e4e4e7"
                            textColor="#18181b"
                            strokeColor="#d4d4d8"
                        />
                    </GizmoHelper>

                    <OrbitControls makeDefault ref={controlsRef} />
                </Canvas>

                <button
                    type="button"
                    className="absolute top-[0px] right-[0px] z-10 p-1 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (controlsRef.current && controlsRef.current.object) {
                            controlsRef.current.reset();
                            controlsRef.current.target.set(0, 0, 0);
                            controlsRef.current.update();
                        }
                    }}
                    title="Vista Standard"
                >
                    <Home className="w-5 h-5" />
                </button>

                {selectedNodeId && (
                    <div className="ui-canvas-editor-panel">
                        <div className="ui-canvas-editor-panel-header">
                            <span className="font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Selezione Attiva</span>
                            <button className="text-muted-foreground hover:text-red-500 transition-colors" onClick={() => setSelectedNodeId(null)}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-muted-foreground"><span>NODE ID</span> <span className="font-mono truncate w-24 text-right" title={selectedNodeId}>{selectedNodeId.substring(0, 8)}...</span></div>
                            {(() => {
                                const selectedPartData = parts.find(p => p.id === selectedNodeId);
                                if (!selectedPartData) return null;
                                return (
                                    <>
                                        <div className="flex justify-between font-medium">
                                            <span>Part Name:</span>
                                            <span className="truncate max-w-[120px]">{availableParts.find(p => p.id === selectedPartData.partId)?.name || 'Unknown'}</span>
                                        </div>
                                        <div className="ui-canvas-editor-panel-section">
                                            <div>
                                                <div className="text-muted-foreground mb-1 font-semibold">POSITION (m)</div>
                                                <div className="grid grid-cols-3 gap-1">
                                                    {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                                                        <div key={`pos-${axis}`} className="ui-canvas-editor-panel-input-container">
                                                            <span className="text-muted-foreground font-medium">{axis}</span>
                                                            <input
                                                                type="number"
                                                                step="0.05"
                                                                className="ui-canvas-editor-panel-input"
                                                                defaultValue={selectedPartData.position[i].toFixed(3)}
                                                                key={`pos-${axis}-${selectedPartData.id}-${selectedPartData.position[i]}`}
                                                                onBlur={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (!isNaN(val)) {
                                                                        const newPos = [...selectedPartData.position] as [number, number, number];
                                                                        newPos[i] = val;
                                                                        handleTransformEnd(selectedPartData.id, newPos, selectedPartData.rotation);
                                                                    }
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') e.currentTarget.blur();
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground mb-1 font-semibold">ROTATION (deg)</div>
                                                <div className="grid grid-cols-3 gap-1">
                                                    {(['X', 'Y', 'Z'] as const).map((axis, i) => (
                                                        <div key={`rot-${axis}`} className="ui-canvas-editor-panel-input-container">
                                                            <span className="text-muted-foreground font-medium">{axis}</span>
                                                            <input
                                                                type="number"
                                                                step="1"
                                                                className="ui-canvas-editor-panel-input"
                                                                defaultValue={(selectedPartData.rotation[i] * 180 / Math.PI).toFixed(1)}
                                                                key={`rot-${axis}-${selectedPartData.id}-${selectedPartData.rotation[i]}`}
                                                                onBlur={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    if (!isNaN(val)) {
                                                                        const newRot = [...selectedPartData.rotation] as [number, number, number];
                                                                        newRot[i] = val * Math.PI / 180;
                                                                        handleTransformEnd(selectedPartData.id, selectedPartData.position, newRot);
                                                                    }
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') e.currentTarget.blur();
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="ui-canvas-flex-between mt-2 pt-2 border-t border-border font-medium">
                                                <span>Mode:</span>
                                                <span className="uppercase text-blue-500">{transformMode}</span>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
