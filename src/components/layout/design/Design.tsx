"use client";
import { useTranslations } from "next-intl";

import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    CameraControls,
    Environment,
    Grid,
    GizmoHelper,
    Bvh
} from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { XR } from "@react-three/xr";
import { EffectComposer, N8AO, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from "three-mesh-bvh";

// Global prototype extensions for three-mesh-bvh
// eslint-disable-next-line @typescript-eslint/no-explicit-any
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree as any;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

import { partsTunnel } from "./tunnel";
import { useDesignStore, CanvasEntity } from "./store";
import GenericPart from "./GenericPart";
import InstancedPartGroup from "./InstancedPartGroup";
import { ZUpGizmoViewcube } from "./ZUpGizmoViewcube";
import { useTheme } from "@/providers/ThemeProvider";
import { xrStore } from "./xrStore";
import { DesignCatalogSidebar } from "./DesignCatalogSidebar";
import { DesignTour } from "./DesignTour";
import { DesignTools } from "./DesignTools";
import { DesignAI } from "./DesignAI";
import { useDictionarySync } from "./useDictionarySync";

function ScaledMarker({ type, isActive }: { type: 'corner' | 'origin' | 'midpoint', isActive: boolean }) {
    const ref = useRef<THREE.Mesh>(null!);

    useFrame(({ camera }) => {
        if (ref.current) {
            const dist = camera.position.distanceTo(ref.current.getWorldPosition(new THREE.Vector3()));
            // Dynamic scale formula based on camera distance
            const scale = Math.max(0.2, dist * 0.15);
            ref.current.scale.setScalar(scale);
        }
    });

    const color = isActive ? "#ef4444" : "#2CFF05";
    const zOffset = 0.005; // Lift off surface to avoid z-fighting

    if (type === 'corner' || type === 'origin') {
        const radius = isActive ? 0.025 : 0.015;
        return (
            <mesh ref={ref} position={[0, 0, zOffset]}>
                <sphereGeometry args={[radius, 16, 16]} />
                <meshBasicMaterial color={color} depthTest={false} transparent opacity={isActive ? 0.8 : 1} />
            </mesh>
        );
    } else {
        const radius = isActive ? 0.04 : 0.03;
        return (
            <mesh ref={ref} position={[0, 0, zOffset]}>
                <circleGeometry args={[radius, 3]} />
                <meshBasicMaterial color={color} side={THREE.DoubleSide} depthTest={false} transparent opacity={isActive ? 0.8 : 0.8} />
            </mesh>
        );
    }
}

const CanvasEntitiesRenderer = () => {
    const ObjectValues = Object.values(useDesignStore((state) => state.entities));
    const selectedEntityId = useDesignStore((state) => state.selectedEntityId);

    const renderGroups: Record<string, CanvasEntity[]> = {};
    const solitaryEntities: CanvasEntity[] = [];

    ObjectValues.forEach((entity) => {
        // Exclude the selected entity so it stays solitary (needed for TransformControls)
        if (entity.id === selectedEntityId) {
            solitaryEntities.push(entity);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dims = entity.metadata?.dimensions || entity.metadata?.args || (entity as any).dimensions;
        const dimKey = Array.isArray(dims) ? dims.join("-") : "default";

        // Create a visual hash for grouping
        const visualHash = `${entity.baseEntityId}_${entity.metadata?.materialId || 'none'}_${entity.metadata?.textureId || 'none'}_${dimKey}`;
        
        if (!renderGroups[visualHash]) {
            renderGroups[visualHash] = [];
        }
        renderGroups[visualHash].push(entity);
    });

    return (
        <>
            {/* Render Solitary Elements (e.g. Selected) */}
            {solitaryEntities.map((entity) => (
                <GenericPart key={`solitary-${entity.id}`} entity={entity} />
            ))}

            {/* Render grouped InstancedMeshes */}
            {Object.entries(renderGroups).map(([hash, group]) => {
                if (group.length === 1) {
                    // Optimization: If only 1 object, use GenericPart to avoid InstancedMesh overhead
                    return <GenericPart key={group[0].id} entity={group[0]} />;
                }
                return <InstancedPartGroup key={hash} entities={group} />;
            })}
        </>
    );
};

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
    return <axesHelper ref={axesRef} args={[5]} />;
};

interface StandloCanvasProps {
    entityId?: string;
    entityType?: string | null;
    active?: boolean;
    isOverlay?: boolean;
}

export default function StandloCanvas({ entityId, entityType, active = true, isOverlay = false }: StandloCanvasProps) {
    useDictionarySync();
    const { theme: resolvedTheme } = useTheme();
    const tGizmo = useTranslations("Canvas.tools.gizmo");
    const viewMode = useDesignStore((state) => state.viewMode);
    const cameraControlsRef = useRef<CameraControls>(null);
    const addEntity = useDesignStore((state) => state.addEntity);
    const clearCanvas = useDesignStore((state) => state.clearCanvas);

    const transformMode = useDesignStore((state) => state.transformMode);
    const setTransformMode = useDesignStore((state) => state.setTransformMode);
    const cameraMode = useDesignStore((state) => state.cameraMode);
    const cameraResetTrigger = useDesignStore((state) => state.cameraResetTrigger);
    const isDragging = useDesignStore((state) => state.isDragging);

    const hoverSnap = useDesignStore((state) => state.hoverSnap);
    const setHoverSnap = useDesignStore((state) => state.setHoverSnap);
    const snapSource = useDesignStore((state) => state.snapSource);
    const setSnapSource = useDesignStore((state) => state.setSnapSource);
    const updateEntityPosition = useDesignStore((state) => state.updateEntityPosition);
    const entities = useDesignStore((state) => state.entities);

    const executeSnap = (source: { id: string; point: THREE.Vector3Tuple; normal: THREE.Vector3Tuple; type: string }, target: { id: string; point: THREE.Vector3Tuple; normal: THREE.Vector3Tuple; type: string }) => {
        const node = entities[source.id];
        if (!node) return;

        const pA = new THREE.Vector3(...source.point);
        const pB = new THREE.Vector3(...target.point);

        const translation = pB.clone().sub(pA);
        const center = new THREE.Vector3(...node.position);
        const newPos = center.clone().add(translation);

        updateEntityPosition(node.id, [newPos.x, newPos.y, newPos.z]);
    };

    // Hardcoded lighting intensities to replace Leva controls
    const ambientIntensity = 0.5;
    const dirLightIntensity = 1.5;
    const aoIntensity = 1.5;
    const bloomThreshold = 1.0;
    const debugPhysics = false;

    // React to viewMode changes to animate camera
    useEffect(() => {
        if (!cameraControlsRef.current) return;
        const cc = cameraControlsRef.current;

        if (viewMode === "2D") {
            // Top-down view
            cc.setLookAt(0, 50, 0, 0, 0, 0, true);
        } else if (viewMode === "3D") {
            // Isometric-ish view
            cc.setLookAt(15, 15, 15, 0, 0, 0, true);
        }
    }, [viewMode]);

    // React to manual camera resets from GUI tools
    useEffect(() => {
        if (!cameraControlsRef.current || cameraResetTrigger === 0) return;
        const cc = cameraControlsRef.current;
        // Isometric-ish view
        cc.setLookAt(10, 10, 10, 0, 0, 0, true);
    }, [cameraResetTrigger]);

    // Initialization logic: Fetch root entity (mesh or hierarchy nodes)
    useEffect(() => {
        if (!entityId) return;
        let isMounted = true;
        let unsubscribe: (() => void) | undefined;
        let hasFetched = false;

        const init = async () => {
            try {
                const { auth } = await import("@/core/firebase");
                const { onAuthStateChanged } = await import("firebase/auth");

                unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                    // Do not mark hasFetched=true immediately if currentUser is null, give it a moment unless we are forcing public
                    if (!isMounted) return;
                    if (hasFetched) return;

                    // We mark fetched if there's a user, OR if this is definitely a public canvas context
                    if (currentUser || entityType === "canvas") {
                        hasFetched = true;
                    }

                    try {


                        let targetSchema = entityType === "canvas" ? "canvas" : "mesh";
                        if (entityType === "part" || entityId.startsWith("PAR-")) targetSchema = "part";
                        else if (entityType === "assembly" || entityId.startsWith("ASS-")) targetSchema = "assembly";
                        else if (entityType === "design" || entityId.startsWith("DES-")) targetSchema = "design";



                        let isOk = false;
                        let unwrappedData: Record<string, unknown> | null = null;
                        // Centralized API Client
                        const { callGateway } = await import("@/lib/api");

                        try {


                            unwrappedData = await callGateway("orchestrator", {
                                actionId: "read",
                                entityId: targetSchema,
                                payload: { id: entityId } // Use specific meshId if it's a mesh, else use general entityId
                            });
                            isOk = true;
                        } catch (err) {
                            console.error("[Canvas Init] Orchestrator read failed:", err);
                        }

                        if (isOk && isMounted) {

                            if (unwrappedData) {
                                clearCanvas(); // Reset canvas state before injection

                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const recordData = unwrappedData as any;

                                if (recordData.geometryType) {
                                    addEntity({
                                        id: entityId,
                                        baseEntityId: `primitive_${recordData.geometryType || "box"}`,
                                        type: "mesh",
                                        position: [0, (recordData.dimensions?.[2] ?? recordData.dimensions?.[1] ?? 1) / 2, 0],
                                        rotation: [0, 0, 0, 1],
                                        sockets: [],
                                        order: 0,
                                        metadata: {
                                            geometry: recordData.geometryType || "box",
                                            dimensions: recordData.dimensions || [1, 1, 1],
                                            materialId: recordData.materialId,
                                            textureId: recordData.textureId
                                        }
                                    });
                                } else {
                                    try {

                                        const resultsData = await callGateway("orchestrator", {
                                            actionId: "list",
                                            entityId: `${targetSchema}/${entityId}/objects`, // Fetching the subcollection
                                            payload: {}
                                        });
                                        // Safe type unwrapping using any to bypass strict checks that caused build failures
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        let actualList: any[] = [];
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const resultsAny = resultsData as any;
                                        const objectsList = resultsAny.data || resultsAny;
                                        actualList = objectsList.data || objectsList;

                                        if (Array.isArray(actualList)) {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            actualList.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            actualList.forEach((obj: any) => {
                                                addEntity({
                                                    id: obj.id as string,
                                                    baseEntityId: obj.baseEntityId as string,
                                                    type: obj.type as "mesh" | "part" | "assembly" | "bundle" | "design",
                                                    parentId: obj.parentId as string | undefined, // Restore hierarchical parent
                                                    position: (obj.position as [number, number, number]) || [0, 0, 0],
                                                    rotation: (obj.rotation as [number, number, number, number]) || [0, 0, 0, 1],
                                                    sockets: [],
                                                    order: (obj.order as number) || 0,
                                                    metadata: obj.metadata as CanvasEntity["metadata"],
                                                    meshOverrides: obj.meshOverrides as CanvasEntity["meshOverrides"]
                                                });
                                            });
                                        }
                                    } catch (subErr) {
                                        console.error("Failed to fetch Canvas Objects subcollection:", subErr);
                                    }
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Canvas Initialization fetch failed", e);
                    }
                });
            } catch (err) {
                console.error("Failed to setup auth listener for canvas", err);
            }
        };

        init();
        return () => {
            isMounted = false;
            if (unsubscribe) unsubscribe();
        };
    }, [entityId, entityType, addEntity, clearCanvas]);

    if (!active) {
        return <div className="w-full h-full relative pointer-events-none bg-transparent" />;
    }

    return (
        <div className={`w-full h-full relative ${isOverlay ? 'bg-transparent' : 'bg-[#f8f9fa] dark:bg-[#18181b]'}`}>

            <Canvas
                shadows={{ type: THREE.PCFShadowMap }}
                camera={cameraMode === 'orthographic' ? { position: [10, 10, 10], zoom: 20 } : { position: [10, 10, 10], fov: 60 }}
                orthographic={cameraMode === 'orthographic'}
                // Orthographic behavior is managed dynamically or via CameraControls if needed,
                // but for seamless transitions, a perspective camera at a high distance with low FOV can simulate orthographic,
                // or we use setLookAt. We stick to perspective for smooth interpolation out-of-the-box.
                gl={{ preserveDrawingBuffer: true, alpha: true }} // Required for .toDataURL() exports and transparent backgrounds
                onPointerMissed={async () => {
                    const store = useDesignStore.getState();
                    store.setTransformMode(null);
                    const activeId = store.selectedEntityId;
                    if (activeId) {
                        const activeEntity = store.entities[activeId];
                        store.selectEntity(null);

                        if (activeEntity && entityId) { // canvasId is passed as entityId to this component
                            try {
                                const { callGateway } = await import("@/lib/api");
                                const clamp = (v: number) => Number(v.toFixed(3));
                                callGateway("orchestrator", {
                                    actionId: "updateNode",
                                    payload: {
                                        canvasId: entityId,
                                        nodeId: activeId,
                                        position: activeEntity.position.map(clamp) as [number, number, number],
                                        rotation: activeEntity.rotation.map(clamp) as [number, number, number, number] | [number, number, number],
                                        metadata: activeEntity.metadata
                                    }
                                }).catch((e) => console.error("Async updateNode failed on deselect", e));
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    }
                }}
            >
                <Suspense fallback={null}>
                    <partsTunnel.Out />

                    {/* Lighting & Environment */}
                    <ambientLight intensity={ambientIntensity} />
                    <directionalLight
                        castShadow
                        position={[10, 20, 10]}
                        intensity={dirLightIntensity}
                        shadow-mapSize={[2048, 2048]}
                    />
                    <Environment preset="city" />

                    {/* Ground Plane & Grid */}
                    <Grid
                        cellSize={0.1}
                        cellThickness={1}
                        cellColor={resolvedTheme === "dark" ? "#3f3f46" : "hsl(220, 13%, 65%)"}
                        sectionSize={1}
                        sectionThickness={1.5}
                        sectionColor={resolvedTheme === "dark" ? "#52525b" : "hsl(220, 13%, 75%)"}
                        fadeDistance={50}
                        fadeStrength={1}
                        followCamera={false}
                        infiniteGrid={true}
                    />

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
                                    point: [0, 0, 0],
                                    normal: [0, 0, 1],
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
                        <group position={hoverSnap.point} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...hoverSnap.normal))}>
                            <ScaledMarker type={hoverSnap.type} isActive={snapSource?.id === hoverSnap.id} />
                        </group>
                    )}
                    {transformMode === "snap" && snapSource && (
                        <group position={snapSource.point} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...snapSource.normal))}>
                            <ScaledMarker type={snapSource.type} isActive={true} />
                        </group>
                    )}

                    {/* Interactive Camera Controls */}
                    <CameraControls
                        ref={cameraControlsRef}
                        makeDefault
                        enabled={!isDragging}
                        minDistance={2}
                        maxDistance={100}
                        maxPolarAngle={viewMode === "2D" ? 0 : Math.PI / 2 + 0.1} // Restrict going below ground in 3D, strict top-down in 2D
                    />

                    {/* Orientation Gizmo */}
                    <GizmoHelper
                        alignment="top-right"
                        margin={[96, 156]}
                        renderPriority={2}
                    >
                        <ZUpGizmoViewcube
                            faces={[tGizmo('right'), tGizmo('left'), tGizmo('top'), tGizmo('bottom'), tGizmo('front'), tGizmo('back')]}
                            color="#f4f4f5"
                            hoverColor="#e4e4e7"
                            textColor="#18181b"
                            strokeColor="#d4d4d8"
                        />
                    </GizmoHelper>

                    {/* XR Session Wrapper */}
                    <XR store={xrStore}>
                        {/* Entities injected here from Zustand with Physics & optimized Raycasting */}
                        <Bvh firstHitOnly>
                            <Physics debug={debugPhysics} gravity={[0, -9.81, 0]}>
                                <CanvasEntitiesRenderer />
                            </Physics>
                        </Bvh>

                        {/* Premium Visuals Processing - Disabled in XR to fix black screen issue */}
                        {!xrStore.getState().session && (
                            <EffectComposer>
                                <N8AO aoRadius={1} intensity={aoIntensity} halfRes />
                                <Bloom mipmapBlur luminanceThreshold={bloomThreshold} intensity={0.5} />
                            </EffectComposer>
                        )}
                    </XR>
                </Suspense>
            </Canvas>

            <DesignCatalogSidebar entityId={entityId} entityType={entityType} />
            <DesignTour />
            <DesignTools />
            <DesignAI />
        </div>
    );
}
