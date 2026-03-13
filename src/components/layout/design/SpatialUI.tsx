"use client";

import { useDesignStore } from "@/lib/zustand";
import { Text, Plane } from "@react-three/drei";
import { XRSpace, useXRSessionVisibilityState } from "@react-three/xr";
import { useState } from "react";

function SpatialButton({ position, label, onClick }: { position: [number, number, number], label: string, onClick: () => void }) {
    const [hover, setHover] = useState(false);
    return (
        <group position={position}>
            <Plane args={[0.08, 0.03]} 
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                onPointerOver={(e) => { e.stopPropagation(); setHover(true); }}
                onPointerOut={(e) => { e.stopPropagation(); setHover(false); }}
            >
                <meshBasicMaterial color={hover ? "#3b82f6" : "#27272a"} transparent opacity={0.9} />
            </Plane>
            <Text position={[0, 0, 0.001]} fontSize={0.01} color="white" anchorX="center" anchorY="middle" outlineWidth={0.001} outlineColor="#000">
                {label}
            </Text>
        </group>
    );
}

export function SpatialUI() {
    const mode = useDesignStore(s => s.mode);
    const setMode = useDesignStore(s => s.setMode);
    
    // Only render if we're in XR and it's visible. Otherwise it hides itself.
    const visibility = useXRSessionVisibilityState();
    if (visibility === 'hidden' || visibility === undefined) return null;

    return (
        <XRSpace space="viewer">
            {/* Anchored to the headset/camera (viewer space). Floating down and Forward */}
            <group position={[0, -0.2, -0.5]} rotation={[-Math.PI / 8, 0, 0]}>
                
                {/* Background Panel - Watch/Dashboard */}
                <Plane args={[0.2, 0.15]} position={[0, 0, -0.01]}>
                    <meshBasicMaterial color="#09090b" opacity={0.8} transparent />
                </Plane>

                <Text position={[0, 0.05, 0]} fontSize={0.015} color="white" anchorX="center" anchorY="middle">
                    STANDLO OS
                </Text>

                <SpatialButton position={[-0.05, 0.01, 0]} label={mode === 'part' ? 'Chiudi Parti' : 'Apri Parti'} onClick={() => setMode(mode === 'part' ? null : 'part')} />
                <SpatialButton position={[0.05, 0.01, 0]} label="Sposta" onClick={() => useDesignStore.getState().setTransformMode('translate')} />
                
                <SpatialButton position={[-0.05, -0.03, 0]} label="Ruota" onClick={() => useDesignStore.getState().setTransformMode('rotate')} />
                <SpatialButton position={[0.05, -0.03, 0]} label="Deseleziona" onClick={() => useDesignStore.getState().selectEntity(null)} />

            </group>
        </XRSpace>
    );
}
