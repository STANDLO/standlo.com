"use client";

import { Suspense, useRef } from "react";
import { Canvas as ThreeCanvas } from "@react-three/fiber";
import { CameraControls, Environment } from "@react-three/drei";
import * as THREE from "three";

export function Canvas() {
    const cameraControlsRef = useRef<CameraControls>(null);
    const ambientIntensity = 0.5;
    const dirLightIntensity = 1.5;

    return (
        <div className="absolute inset-0 z-0 pointer-events-auto">
            <ThreeCanvas
                shadows={{ type: THREE.PCFShadowMap }}
                camera={{ position: [15, 15, 15], fov: 45 }}
                gl={{ preserveDrawingBuffer: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={ambientIntensity} />
                    <directionalLight
                        castShadow
                        position={[10, 20, 10]}
                        intensity={dirLightIntensity}
                        shadow-mapSize={[2048, 2048]}
                    />
                    <Environment preset="city" />

                    <CameraControls
                        ref={cameraControlsRef}
                        makeDefault
                        minDistance={2}
                        maxDistance={100}
                        maxPolarAngle={Math.PI / 2 + 0.1}
                    />
                    {/* Scene content will go here, currently empty per generic implementation */}
                </Suspense>
            </ThreeCanvas>
        </div>
    );
}
