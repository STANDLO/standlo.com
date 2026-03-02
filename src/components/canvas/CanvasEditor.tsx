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
import { partsTunnel } from "./tunnel";
import { useCanvasStore } from "./store";
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

export default function CanvasEditor() {
    const mode = useCanvasStore((state) => state.mode);
    const viewMode = useCanvasStore((state) => state.viewMode);
    const cameraControlsRef = useRef<CameraControls>(null);

    // Grid size depends on the mode
    const gridSize = mode === "stand" ? 20 : 5;
    const gridDivision = mode === "stand" ? 20 : 50;

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

    return (
        <div className="w-full h-full relative bg-stone-50 dark:bg-black">

            <Canvas
                shadows
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
                        cellColor="#6f6f6f"
                        sectionSize={1}
                        sectionThickness={1.5}
                        sectionColor="#9d4b4b"
                        fadeDistance={gridSize * 1.5}
                        fadeStrength={1}
                        followCamera={false}
                        infiniteGrid={true}
                    />

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
                        alignment="bottom-right"
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
