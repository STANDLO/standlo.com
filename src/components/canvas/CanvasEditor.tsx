"use client";

import { Suspense, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import {
    CameraControls,
    Environment,
    Grid,
    ContactShadows,
    GizmoHelper,
    GizmoViewport,
    Bvh
} from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { XR, createXRStore } from "@react-three/xr";
import { EffectComposer, N8AO, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { partsTunnel } from "./tunnel";
import { useCanvasStore, CanvasEntity } from "./store";
import GenericPart from "./GenericPart";

export const xrStore = createXRStore({ emulate: false, offerSession: false });

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

interface CanvasEditorProps {
    entityId?: string;
    entityType?: string | null;
}

export default function CanvasEditor({ entityId, entityType }: CanvasEditorProps) {
    const viewMode = useCanvasStore((state) => state.viewMode);
    const cameraControlsRef = useRef<CameraControls>(null);
    const addEntity = useCanvasStore((state) => state.addEntity);
    const clearCanvas = useCanvasStore((state) => state.clearCanvas);

    // Fixed grid size for a consistent workspace (Three.js default: 1 unit = 1m)
    const gridSize = 20;
    const gridDivision = 50;

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
                    if (!currentUser || hasFetched || !isMounted) return;
                    hasFetched = true;

                    try {
                        const idToken = await currentUser.getIdToken();

                        let targetSchema = "mesh";
                        if (entityType === "part" || entityId.startsWith("PAR-")) targetSchema = "part";
                        else if (entityType === "assembly" || entityId.startsWith("ASS-")) targetSchema = "assembly";
                        else if (entityType === "stand" || entityId.startsWith("STA-")) targetSchema = "stand";

                        const res = await fetch(`/api/gateway?target=orchestrator`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${idToken}`
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

                            if (unwrappedData) {
                                clearCanvas(); // Reset canvas state before injection

                                if (targetSchema === "mesh") {
                                    addEntity({
                                        id: entityId,
                                        baseEntityId: `primitive_${unwrappedData.geometryType || "box"}`,
                                        type: "mesh",
                                        position: [0, (unwrappedData.dimensions?.[1] || 1) / 2, 0],
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
                                        const subRes = await fetch(`/api/gateway?target=orchestrator`, {
                                            method: "POST",
                                            headers: {
                                                "Content-Type": "application/json",
                                                "Authorization": `Bearer ${idToken}`
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

    return (
        <div className="w-full h-full relative bg-[#f8f9fa] dark:bg-[#18181b]">

            <Canvas
                shadows={{ type: THREE.PCFShadowMap }}
                camera={{ position: [15, 15, 15], fov: 45 }}
                // Orthographic behavior is managed dynamically or via CameraControls if needed,
                // but for seamless transitions, a perspective camera at a high distance with low FOV can simulate orthographic,
                // or we use setLookAt. We stick to perspective for smooth interpolation out-of-the-box.
                gl={{ preserveDrawingBuffer: true }} // Required for .toDataURL() exports
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
                        args={[gridSize, gridSize]}
                        cellSize={gridSize / gridDivision}
                        cellThickness={1}
                        cellColor="#e4e4e7"
                        sectionSize={1}
                        sectionThickness={1.5}
                        sectionColor="#a1a1aa"
                        fadeDistance={Math.max(gridSize * 1.5, 30)}
                        fadeStrength={1}
                        followCamera={false}
                        infiniteGrid={true}
                    />

                    {/* XYZ Axes Helper (Red: X, Green: Y, Blue: Z) */}
                    <axesHelper args={[5]} />

                    {/* Soft Contact Shadows on the ground */}
                    <ContactShadows
                        position={[0, -0.01, 0]}
                        opacity={0.4}
                        scale={gridSize}
                        blur={2}
                        far={4}
                    />

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
                        margin={[80, 80]}
                    >
                        <GizmoViewport axisColors={['#ff3653', '#8adb00', '#2c8fdf']} labelColor="black" />
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
        </div>
    );
}
