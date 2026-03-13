"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid, TransformControls, Html, PerspectiveCamera, OrthographicCamera } from "@react-three/drei";
import { Plus, Move, RotateCw, Search, X, Copy, Layers, Box, PackageOpen } from "lucide-react";
import { OrchestratorClient } from "../../../lib/orchestratorClient";

const MutedAxes = () => {
    const axesRef = useRef<THREE.AxesHelper>(null);
    useEffect(() => {
        if (axesRef.current) {
            axesRef.current.setColors(
                new THREE.Color('#ef4444').multiplyScalar(0.6),
                new THREE.Color('#22c55e').multiplyScalar(0.6),
                new THREE.Color('#3b82f6').multiplyScalar(0.6)
            );
        }
    }, []);
    return <axesHelper ref={axesRef} args={[5]} />;
};

export type StandPartNode = {
    id: string;
    partId: string;
    position: [number, number, number];
    rotation: [number, number, number];
};

export type StandAssemblyNode = {
    id: string;
    assemblyId: string;
    position: [number, number, number];
    rotation: [number, number, number];
};

export type StandBundleNode = {
    id: string;
    bundleId: string;
    position: [number, number, number];
    rotation: [number, number, number];
};

type StandCanvasEditorProps = {
    parts: StandPartNode[];
    assemblies: StandAssemblyNode[];
    bundles: StandBundleNode[];
    onChangeParts: (parts: StandPartNode[]) => void;
    onChangeAssemblies: (assemblies: StandAssemblyNode[]) => void;
    onChangeBundles: (bundles: StandBundleNode[]) => void;
};

type GenericEntity = {
    id: string;
    name: { it: string, en?: string };
    code?: string;
};

type PartEntity = GenericEntity & { meshId?: string; cost?: number; price?: number; };
type AssemblyEntity = GenericEntity & { parts?: { partId: string; position: [number, number, number]; rotation: [number, number, number] }[] };
type BundleEntity = GenericEntity & { parts?: StandPartNode[], assemblies?: StandAssemblyNode[] };

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

export default function StandCanvasEditor({ parts, assemblies, bundles, onChangeParts, onChangeAssemblies, onChangeBundles }: StandCanvasEditorProps) {
    const [availableParts, setAvailableParts] = useState<PartEntity[]>([]);
    const [availableAssemblies, setAvailableAssemblies] = useState<AssemblyEntity[]>([]);
    const [availableBundles, setAvailableBundles] = useState<BundleEntity[]>([]);

    const [meshCache, setMeshCache] = useState<Record<string, MeshEntity>>({});
    const [materialCache, setMaterialCache] = useState<Record<string, MaterialEntity>>({});

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedNodeType, setSelectedNodeType] = useState<"part" | "assembly" | "bundle" | null>(null);

    const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "snap">("translate");
    const [cameraMode, setCameraMode] = useState<"perspective" | "orthographic">("perspective");
    const [shadingMode] = useState<"shaded" | "shaded_edges" | "white_edges">("shaded");



    const [searchType, setSearchType] = useState<"part" | "assembly" | "bundle">("part");
    const [searchTerm, setSearchTerm] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const controlsRef = useRef<React.ElementRef<typeof OrbitControls> & { enabled: boolean }>(null);

    useEffect(() => {
        const loadGlobals = async () => {
            try {
                const resMat = await fetch("/admin/api/registry/materials");
                if (resMat.ok) {
                    const matsJson = await resMat.json();
                    const mats = matsJson.data || matsJson || [];
                    const matMap: Record<string, MaterialEntity> = {};
                    if (Array.isArray(mats)) {
                        mats.forEach((m: MaterialEntity) => matMap[m.id] = m);
                    }
                    setMaterialCache(matMap);
                }

                const [pData, aData, bData] = await Promise.all([
                    OrchestratorClient.list<PartEntity>("part", { limit: 1000 }),
                    OrchestratorClient.list<AssemblyEntity>("assembly", { limit: 1000 }),
                    OrchestratorClient.list<BundleEntity>("bundle", { limit: 1000 })
                ]);

                if (pData) setAvailableParts(pData);
                if (aData) setAvailableAssemblies(aData);
                if (bData) setAvailableBundles(bData);
            } catch (e) {
                console.error("Failed loading globals", e);
            }
        };
        loadGlobals();
    }, []);

    useEffect(() => {
        const loadMissingMeshes = async () => {
            const meshesToLoad = new Set<string>();

            parts.forEach(node => {
                const partDef = availableParts.find(p => p.id === node.partId);
                if (partDef?.meshId && !meshCache[partDef.meshId]) meshesToLoad.add(partDef.meshId);
            });

            // For deeper caching, you would iterate over assembly/bundle structures here if they were fully expanded locally
            // In a real scenario, we might want to lazy load the sub-parts of assemblies and bundles.

            for (const meshId of Array.from(meshesToLoad)) {
                try {
                    const data = await OrchestratorClient.read<MeshEntity>("mesh", meshId);
                    if (data) setMeshCache(prev => ({ ...prev, [meshId]: data }));
                } catch (e) { console.error(e); }
            }
        };
        if (availableParts.length > 0) {
            loadMissingMeshes();
        }
    }, [parts, availableParts, meshCache]);

    const duplicateSelected = () => {
        if (!selectedNodeId || !selectedNodeType) return;

        let node;
        switch (selectedNodeType) {
            case "part":
                node = parts.find(p => p.id === selectedNodeId);
                if (node) {
                    const newPart: StandPartNode = { id: generateLocalId(), partId: node.partId, position: [node.position[0] + 0.5, node.position[1] + 0.5, node.position[2]], rotation: [...node.rotation] };
                    onChangeParts([...parts, newPart]);
                    handleSelectNode(newPart.id, "part");
                }
                break;
            case "assembly":
                node = assemblies.find(a => a.id === selectedNodeId);
                if (node) {
                    const newAssembly: StandAssemblyNode = { id: generateLocalId(), assemblyId: node.assemblyId, position: [node.position[0] + 0.5, node.position[1] + 0.5, node.position[2]], rotation: [...node.rotation] };
                    onChangeAssemblies([...assemblies, newAssembly]);
                    handleSelectNode(newAssembly.id, "assembly");
                }
                break;
            case "bundle":
                node = bundles.find(b => b.id === selectedNodeId);
                if (node) {
                    const newBundle: StandBundleNode = { id: generateLocalId(), bundleId: node.bundleId, position: [node.position[0] + 0.5, node.position[1] + 0.5, node.position[2]], rotation: [...node.rotation] };
                    onChangeBundles([...bundles, newBundle]);
                    handleSelectNode(newBundle.id, "bundle");
                }
                break;
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            const key = e.key.toLowerCase();
            if (key === 'p') setTransformMode('translate');
            if (key === 'r') setTransformMode('rotate');
            if (key === 's') setTransformMode('snap');
            if (key === 'escape') setTransformMode('translate');

            if (key === 'd' && selectedNodeId && selectedNodeType) {
                e.preventDefault();
                duplicateSelected();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNodeId, selectedNodeType, parts, assemblies, bundles]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectNode = (id: string | null, type: "part" | "assembly" | "bundle" | null) => {
        setSelectedNodeId(id);
        setSelectedNodeType(type);
    };

    const handleAddNode = (id: string) => {
        const offset = (parts.length + assemblies.length + bundles.length) * 0.5;
        const newId = generateLocalId();

        if (searchType === "part") {
            const newNode: StandPartNode = { id: newId, partId: id, position: [offset, 0, 0], rotation: [0, 0, 0] };
            onChangeParts([...parts, newNode]);
            handleSelectNode(newNode.id, "part");
        } else if (searchType === "assembly") {
            const newNode: StandAssemblyNode = { id: newId, assemblyId: id, position: [offset, 0, 0], rotation: [0, 0, 0] };
            onChangeAssemblies([...assemblies, newNode]);
            handleSelectNode(newNode.id, "assembly");
        } else if (searchType === "bundle") {
            const newNode: StandBundleNode = { id: newId, bundleId: id, position: [offset, 0, 0], rotation: [0, 0, 0] };
            onChangeBundles([...bundles, newNode]);
            handleSelectNode(newNode.id, "bundle");
        }

        setSearchTerm("");
        setShowSuggestions(false);
    };

    const handleTransformEnd = (id: string, type: "part" | "assembly" | "bundle", newPos: [number, number, number], newRot: [number, number, number]) => {
        const cleanPos = newPos.map(v => Math.round(v * 1000) / 1000) as [number, number, number];
        const cleanRot = newRot.map(v => Number.isNaN(v) ? 0 : Math.round(v * 100000) / 100000) as [number, number, number];

        if (type === "part") {
            onChangeParts(parts.map(p => p.id === id ? { ...p, position: cleanPos, rotation: cleanRot } : p));
        } else if (type === "assembly") {
            onChangeAssemblies(assemblies.map(a => a.id === id ? { ...a, position: cleanPos, rotation: cleanRot } : a));
        } else if (type === "bundle") {
            onChangeBundles(bundles.map(b => b.id === id ? { ...b, position: cleanPos, rotation: cleanRot } : b));
        }
    };

    const getFilteredList = () => {
        let list: GenericEntity[] = [];
        if (searchType === "part") list = availableParts as GenericEntity[];
        if (searchType === "assembly") list = availableAssemblies as GenericEntity[];
        if (searchType === "bundle") list = availableBundles as GenericEntity[];

        return list.filter(item =>
            (item?.name?.en?.toLowerCase() || item?.name?.it?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (item?.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
        ).slice(0, 10);
    };

    const filteredItems = getFilteredList();

    // Box Visualizer for Parts
    const PartNodeVisualizer = ({ node }: { node: StandPartNode }) => {
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

        const isSelected = selectedNodeId === node.id && selectedNodeType === "part";

        const content = (
            <mesh castShadow receiveShadow>
                <boxGeometry args={[dims[0], dims[2], dims[1]]} />
                <meshStandardMaterial
                    color={color}
                    roughness={roughness}
                    metalness={metalness}
                    emissive={isSelected ? new THREE.Color(0x3b82f6) : new THREE.Color(0x000000)}
                    emissiveIntensity={isSelected ? 0.3 : 0}
                    wireframe={shadingMode === 'white_edges'}
                    transparent={shadingMode === 'white_edges'}
                    opacity={shadingMode === 'white_edges' ? 0.2 : 1}
                />
            </mesh>
        );

        if (isSelected && transformMode !== 'snap') {
            return (
                <TransformControls
                    mode={transformMode}
                    position={node.position}
                    rotation={node.rotation}
                    onMouseUp={(e: unknown) => {
                        if (controlsRef.current) controlsRef.current.enabled = true;
                        const targetObj = (e as { target?: { object?: { position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number } } } })?.target?.object;
                        if (targetObj) {
                            const obj = targetObj;
                            handleTransformEnd(node.id, "part", [obj.position.x, obj.position.y, obj.position.z], [obj.rotation.x, obj.rotation.y, obj.rotation.z]);
                        }
                    }}
                    onMouseDown={() => {
                        if (controlsRef.current) controlsRef.current.enabled = false;
                    }}
                >
                    <group onClick={(e) => e.stopPropagation()}>
                        {content}
                    </group>
                </TransformControls>
            );
        }

        return (
            <group
                position={node.position}
                rotation={node.rotation}
                onClick={(e) => {
                    e.stopPropagation();
                    if (transformMode !== 'snap') {
                        handleSelectNode(node.id, "part");
                    }
                }}
            >
                {content}
            </group>
        );
    };

    // Placeholder box visualizers for Assemblies and Bundles
    const AssemblyNodeVisualizer = ({ node }: { node: StandAssemblyNode }) => {
        const isSelected = selectedNodeId === node.id && selectedNodeType === "assembly";
        // Simplified rendering for assemblies as bounding boxes for now
        const dims: [number, number, number] = [1, 1, 1];
        const color = "#10b981"; // Green for assemblies

        const content = (
            <mesh castShadow receiveShadow>
                <boxGeometry args={[dims[0], dims[2], dims[1]]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={0.5}
                    emissive={isSelected ? new THREE.Color(0x10b981) : new THREE.Color(0x000000)}
                    emissiveIntensity={isSelected ? 0.5 : 0}
                />
            </mesh>
        );

        if (isSelected && transformMode !== 'snap') {
            return (
                <TransformControls
                    mode={transformMode}
                    position={node.position}
                    rotation={node.rotation}
                    onMouseUp={(e: unknown) => {
                        if (controlsRef.current) controlsRef.current.enabled = true;
                        const targetObj = (e as { target?: { object?: { position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number } } } })?.target?.object;
                        if (targetObj) {
                            const obj = targetObj;
                            handleTransformEnd(node.id, "assembly", [obj.position.x, obj.position.y, obj.position.z], [obj.rotation.x, obj.rotation.y, obj.rotation.z]);
                        }
                    }}
                    onMouseDown={() => {
                        if (controlsRef.current) controlsRef.current.enabled = false;
                    }}
                >
                    <group onClick={(e) => e.stopPropagation()}>
                        {content}
                    </group>
                </TransformControls>
            );
        }

        return (
            <group
                position={node.position}
                rotation={node.rotation}
                onClick={(e) => {
                    e.stopPropagation();
                    if (transformMode !== 'snap') handleSelectNode(node.id, "assembly");
                }}
            >
                {content}
            </group>
        );
    };

    const BundleNodeVisualizer = ({ node }: { node: StandBundleNode }) => {
        const isSelected = selectedNodeId === node.id && selectedNodeType === "bundle";
        // Simplified rendering for bundles as bounding boxes for now
        const dims: [number, number, number] = [1.5, 1.5, 1.5];
        const color = "#f59e0b"; // Yellow-orange for bundles

        const content = (
            <mesh castShadow receiveShadow>
                <boxGeometry args={[dims[0], dims[2], dims[1]]} />
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={0.5}
                    emissive={isSelected ? new THREE.Color(0xf59e0b) : new THREE.Color(0x000000)}
                    emissiveIntensity={isSelected ? 0.5 : 0}
                />
            </mesh>
        );

        if (isSelected && transformMode !== 'snap') {
            return (
                <TransformControls
                    mode={transformMode}
                    position={node.position}
                    rotation={node.rotation}
                    onMouseUp={(e: unknown) => {
                        if (controlsRef.current) controlsRef.current.enabled = true;
                        const targetObj = (e as { target?: { object?: { position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number } } } })?.target?.object;
                        if (targetObj) {
                            const obj = targetObj;
                            handleTransformEnd(node.id, "bundle", [obj.position.x, obj.position.y, obj.position.z], [obj.rotation.x, obj.rotation.y, obj.rotation.z]);
                        }
                    }}
                    onMouseDown={() => {
                        if (controlsRef.current) controlsRef.current.enabled = false;
                    }}
                >
                    <group onClick={(e) => e.stopPropagation()}>
                        {content}
                    </group>
                </TransformControls>
            );
        }

        return (
            <group
                position={node.position}
                rotation={node.rotation}
                onClick={(e) => {
                    e.stopPropagation();
                    if (transformMode !== 'snap') handleSelectNode(node.id, "bundle");
                }}
            >
                {content}
            </group>
        );
    };


    return (
        <div className="w-full h-full min-h-[500px] flex flex-col bg-background relative rounded-md overflow-hidden">
            {/* Toolbar */}
            <div className="ui-canvas-editor-toolbar p-2 bg-muted/30 border-b flex items-center space-x-2">

                {/* Entity Type Selector */}
                <div className="flex bg-muted p-1 rounded-md">
                    <button
                        type="button"
                        onClick={() => { setSearchType("part"); setSearchTerm(""); }}
                        className={`px-3 py-1 rounded-sm text-sm font-medium transition-colors ${searchType === "part" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        title="Search Parts"
                    >
                        <Box className="w-4 h-4 inline-block mr-1" /> Parts
                    </button>
                    <button
                        type="button"
                        onClick={() => { setSearchType("assembly"); setSearchTerm(""); }}
                        className={`px-3 py-1 rounded-sm text-sm font-medium transition-colors ${searchType === "assembly" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        title="Search Assemblies"
                    >
                        <Layers className="w-4 h-4 inline-block mr-1" /> Assemblies
                    </button>
                    <button
                        type="button"
                        onClick={() => { setSearchType("bundle"); setSearchTerm(""); }}
                        className={`px-3 py-1 rounded-sm text-sm font-medium transition-colors ${searchType === "bundle" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        title="Search Bundles"
                    >
                        <PackageOpen className="w-4 h-4 inline-block mr-1" /> Bundles
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-sm ml-2" ref={searchRef}>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={`Search ${searchType}...`}
                            className="ui-canvas-editor-search-input py-1.5 pl-8 pr-8 w-full border rounded text-sm bg-background"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                        />
                        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        {searchTerm && (
                            <button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearchTerm("")}>
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Suggestions Dropdown */}
                    {showSuggestions && searchTerm && (
                        <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredItems.length > 0 ? (
                                <ul className="py-1">
                                    {filteredItems.map(item => (
                                        <li
                                            key={item.id}
                                            className="px-3 py-2 text-sm hover:bg-muted cursor-pointer flex justify-between items-center group"
                                            onClick={() => handleAddNode(item.id)}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.name.en || item.name.it}</span>
                                                <span className="text-xs text-muted-foreground">{item.code || ""}</span>
                                            </div>
                                            <button type="button" className="hidden group-hover:flex bg-primary text-primary-foreground rounded w-5 h-5 items-center justify-center">
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-3 text-sm text-muted-foreground text-center">No {searchType} found</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Transform Mode Toggles */}
                <div className="flex space-x-1 ml-4 bg-muted p-1 rounded-md">
                    <button
                        type="button"
                        onClick={() => setTransformMode("translate")}
                        className={`p-1.5 rounded-sm transition-colors ${transformMode === "translate" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        title="Translate (P)"
                    >
                        <Move className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setTransformMode("rotate")}
                        className={`p-1.5 rounded-sm transition-colors ${transformMode === "rotate" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        title="Rotate (R)"
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>
                    <div className="w-px h-5 bg-border mx-1 self-center" />
                    <button
                        type="button"
                        onClick={duplicateSelected}
                        disabled={!selectedNodeId}
                        className={`p-1.5 rounded-sm transition-colors ${!selectedNodeId ? 'opacity-50 cursor-not-allowed text-muted-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`}
                        title="Duplicate (D)"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (selectedNodeType === "part") onChangeParts(parts.filter(p => p.id !== selectedNodeId));
                            if (selectedNodeType === "assembly") onChangeAssemblies(assemblies.filter(a => a.id !== selectedNodeId));
                            if (selectedNodeType === "bundle") onChangeBundles(bundles.filter(b => b.id !== selectedNodeId));
                            handleSelectNode(null, null);
                        }}
                        disabled={!selectedNodeId}
                        className={`p-1.5 rounded-sm transition-colors ${!selectedNodeId ? 'opacity-50 cursor-not-allowed text-muted-foreground' : 'text-red-500 hover:text-red-600 hover:bg-background'}`}
                        title="Delete (Del)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex space-x-2 ml-auto">
                    <select
                        value={cameraMode}
                        onChange={(e) => setCameraMode(e.target.value as "perspective" | "orthographic")}
                        className="text-sm border rounded bg-background px-2 py-1.5 focus:outline-none"
                    >
                        <option value="perspective">Persp</option>
                        <option value="orthographic">Ortho</option>
                    </select>
                </div>
            </div>

            {/* Canvas */}
            <div className="ui-canvas-editor-canvas-container">
                <Canvas
                    onPointerMissed={() => handleSelectNode(null, null)}
                >
                    {cameraMode === "orthographic" ? (
                        <OrthographicCamera makeDefault position={[10, 10, 10]} zoom={20} near={-100} far={100} />
                    ) : (
                        <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} near={0.1} far={1000} />
                    )}

                    <ambientLight intensity={0.6} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />
                    <directionalLight position={[-10, 10, -10]} intensity={0.5} />

                    <Grid infiniteGrid fadeDistance={40} sectionColor="#94a3b8" cellColor="#cbd5e1" />
                    <MutedAxes />

                    <OrbitControls ref={controlsRef} makeDefault />

                    <Suspense fallback={<Html><div className="bg-white/80 px-2 py-1 rounded text-xs shadow-sm">Loading 3D...</div></Html>}>
                        {parts.map(node => <PartNodeVisualizer key={node.id} node={node} />)}
                        {assemblies.map(node => <AssemblyNodeVisualizer key={node.id} node={node} />)}
                        {bundles.map(node => <BundleNodeVisualizer key={node.id} node={node} />)}
                    </Suspense>
                </Canvas>
            </div>
        </div>
    );
}
