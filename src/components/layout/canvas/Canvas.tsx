"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
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

import { partsTunnel } from "./tunnel";
import { useCanvasStore, CanvasEntity } from "./store";
import GenericPart from "./GenericPart";
import { ZUpGizmoViewcube } from "./ZUpGizmoViewcube";
import { useTheme } from "@/providers/ThemeProvider";
import { xrStore } from "./xrStore";
import { CanvasCatalogSidebar } from "./CanvasCatalogSidebar";
import { CanvasTour } from "./CanvasTour";
import { CanvasTools } from "./CanvasTools";

const CanvasEntitiesRenderer = () => {
    const ObjectValues = Object.values(useCanvasStore((state) => state.entities));
    return (
        <>
            {ObjectValues.map((entity) => (
                <GenericPart key={entity.id} entity={entity} />
            ))}
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
    const { theme: resolvedTheme } = useTheme();
    const viewMode = useCanvasStore((state) => state.viewMode);
    const cameraControlsRef = useRef<CameraControls>(null);
    const addEntity = useCanvasStore((state) => state.addEntity);
    const clearCanvas = useCanvasStore((state) => state.clearCanvas);

    const transformMode = useCanvasStore((state) => state.transformMode);
    const setTransformMode = useCanvasStore((state) => state.setTransformMode);
    const cameraMode = useCanvasStore((state) => state.cameraMode);

    const hoverSnap = useCanvasStore((state) => state.hoverSnap);
    const setHoverSnap = useCanvasStore((state) => state.setHoverSnap);
    const snapSource = useCanvasStore((state) => state.snapSource);
    const setSnapSource = useCanvasStore((state) => state.setSnapSource);
    const updateEntityPosition = useCanvasStore((state) => state.updateEntityPosition);
    const entities = useCanvasStore((state) => state.entities);

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
                        const idToken = currentUser ? await currentUser.getIdToken() : undefined;

                        let targetSchema = entityType === "canvas" ? "canvas" : "mesh";
                        if (entityType === "part" || entityId.startsWith("PAR-")) targetSchema = "part";
                        else if (entityType === "assembly" || entityId.startsWith("ASS-")) targetSchema = "assembly";
                        else if (entityType === "stand" || entityId.startsWith("STA-")) targetSchema = "stand";

                        console.log(`[Canvas Init] entityId=${entityId}, entityType=${entityType}, targetSchema=${targetSchema}, isGuest=${!idToken}`);

                        const res = await fetch(`/api/gateway?target=orchestrator`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {})
                            },
                            body: JSON.stringify({
                                actionId: "read",
                                entityId: targetSchema,
                                payload: { id: entityId }
                            })
                        });

                        if (res.ok && isMounted) {
                            const jsonRes = await res.json();
                            const data = jsonRes.result?.data || jsonRes.data || jsonRes.result || jsonRes;
                            const unwrappedData = data.data || data; // handle deep nesting

                            console.log(`[Canvas Init] Read entity success:`, unwrappedData);

                            if (unwrappedData) {
                                clearCanvas(); // Reset canvas state before injection

                                if (targetSchema === "mesh") {
                                    addEntity({
                                        id: entityId,
                                        baseEntityId: `primitive_${unwrappedData.geometryType || "box"}`,
                                        type: "mesh",
                                        position: [0, (unwrappedData.dimensions?.[2] ?? unwrappedData.dimensions?.[1] ?? 1) / 2, 0],
                                        rotation: [0, 0, 0, 1],
                                        sockets: [],
                                        order: 0,
                                        metadata: {
                                            geometry: unwrappedData.geometryType || "box",
                                            dimensions: unwrappedData.dimensions || [1, 1, 1],
                                            materialId: unwrappedData.materialId,
                                            textureId: unwrappedData.textureId
                                        }
                                    });
                                } else {
                                    try {
                                        console.log(`[Canvas Init] Fetching subcollection for ${targetSchema}/${entityId}/objects`);
                                        const subRes = await fetch(`/api/gateway?target=orchestrator`, {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                                ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {})
                                            },
                                            body: JSON.stringify({
                                                actionId: "list",
                                                entityId: `${targetSchema}/${entityId}/objects`, // Fetching the subcollection
                                                payload: {}
                                            })
                                        });
                                        if (subRes.ok) {
                                            const subJson = await subRes.json();
                                            const objectsList = subJson.result?.data || subJson.data || subJson.result || [];
                                            const actualList = objectsList.data || objectsList;

                                            if (Array.isArray(actualList)) {
                                                actualList.sort((a, b) => (a.order || 0) - (b.order || 0));

                                                actualList.forEach((obj: Record<string, unknown>) => {
                                                    addEntity({
                                                        id: obj.id as string,
                                                        baseEntityId: obj.baseEntityId as string,
                                                        type: obj.type as "part" | "assembly" | "stand",
                                                        position: (obj.position as [number, number, number]) || [0, 0, 0],
                                                        rotation: (obj.rotation as [number, number, number, number]) || [0, 0, 0, 1],
                                                        sockets: [],
                                                        order: (obj.order as number) || 0,
                                                        metadata: obj.metadata as CanvasEntity["metadata"],
                                                        meshOverrides: obj.meshOverrides as CanvasEntity["meshOverrides"]
                                                    });
                                                });
                                            }
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
                camera={cameraMode === 'orthographic' ? { position: [10, 10, 10], zoom: 20 } : { position: [10, 10, 10], fov: 45 }}
                orthographic={cameraMode === 'orthographic'}
                // Orthographic behavior is managed dynamically or via CameraControls if needed,
                // but for seamless transitions, a perspective camera at a high distance with low FOV can simulate orthographic,
                // or we use setLookAt. We stick to perspective for smooth interpolation out-of-the-box.
                gl={{ preserveDrawingBuffer: true, alpha: true }} // Required for .toDataURL() exports and transparent backgrounds
                onPointerMissed={async () => {
                    const store = useCanvasStore.getState();
                    const activeId = store.selectedEntityId;
                    if (activeId) {
                        const activeEntity = store.entities[activeId];
                        store.selectEntity(null);
                        store.setTransformMode(null);

                        if (activeEntity && entityId) { // canvasId is passed as entityId to this component
                            try {
                                const { httpsCallable } = await import("firebase/functions");
                                const { functions: fbFunctions } = await import("@/core/firebase");
                                const canvasFn = httpsCallable(fbFunctions, "canvas");
                                const clamp = (v: number) => Number(v.toFixed(3));
                                canvasFn({
                                    actionId: "updateNode",
                                    payload: {
                                        canvasId: entityId,
                                        nodeId: activeId,
                                        position: activeEntity.position.map(clamp) as [number, number, number],
                                        rotation: activeEntity.rotation.map(clamp) as [number, number, number, number] | [number, number, number],
                                        scale: activeEntity.metadata?.dimensions?.map(clamp) || [1, 1, 1],
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
                        <group position={snapSource.point} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...snapSource.normal))}>
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

                    {/* Interactive Camera Controls */}
                    <CameraControls
                        ref={cameraControlsRef}
                        makeDefault
                        minDistance={2}
                        maxDistance={100}
                        maxPolarAngle={viewMode === "2D" ? 0 : Math.PI / 2 + 0.1} // Restrict going below ground in 3D, strict top-down in 2D
                    />

                    {/* Orientation Gizmo */}
                    <GizmoHelper
                        alignment="top-right"
                        margin={[96, 140]}
                        renderPriority={2}
                    >
                        <ZUpGizmoViewcube
                            faces={['Destra', 'Sinistra', 'Fronte', 'Dietro', 'Sopra', 'Sotto']}
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

                        {/* Premium Visuals Processing */}
                        <EffectComposer>
                            <N8AO aoRadius={1} intensity={aoIntensity} halfRes />
                            <Bloom mipmapBlur luminanceThreshold={bloomThreshold} intensity={0.5} />
                        </EffectComposer>
                    </XR>
                </Suspense>
            </Canvas>

            <CanvasCatalogSidebar entityId={entityId} entityType={entityType} />
            <CanvasTour />
            <CanvasTools />
        </div>
    );
}
