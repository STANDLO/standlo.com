"use client";

import React, { useRef, useState } from "react";
import { Interactive } from "@react-three/xr";
import { useCanvasStore } from "@/hooks/useCanvasStore";
import { useDcode } from "@/hooks/useDcode";
import { Group } from "three";

interface XRGrabbableNodeProps {
    nodeId: string;
    children: React.ReactNode;
}

/**
 * Procedural XR Component for Meta Quest 3 interactions.
 * Connects WebXR Spatial Grabs natively to DCODE updates.
 */
export function XRGrabbableNode({ nodeId, children }: XRGrabbableNodeProps) {
    const groupRef = useRef<Group>(null);
    const [isHovered, setIsHovered] = useState(false);
    
    // Zustand Canvas Brain mappings
    const updateNodeTransform = useCanvasStore((s) => s.updateNodeTransform);
    const getCollisions = useCanvasStore((s) => s.getCollisions);
    const nodeData = useCanvasStore((s) => s.nodes[nodeId]);
    
    // DCODE regex async engine
    const { dispatch } = useDcode();

    // Evaluates pure mathematical bounding-box intersections instantly 
    const isColliding = getCollisions(nodeId).length > 0;

    const handleSelectEnd = () => {
        if (groupRef.current && nodeData) {
            const newPos = [
                groupRef.current.position.x, 
                groupRef.current.position.y, 
                groupRef.current.position.z
            ] as [number, number, number];

            const newRot = [
                groupRef.current.rotation.x,
                groupRef.current.rotation.y,
                groupRef.current.rotation.z
            ] as [number, number, number];

            // 1. 0-Latency Zustand Engine State Override
            updateNodeTransform(nodeId, { position: newPos, rotation: newRot });
            
            // 2. Dispatch asynchronous update to Firestore via DCODE execution engine
            // Syntax: @module #action {payload} (No Ampersand '&' means fire-and-forget background execution)
            dispatch(`@design_objects #update {"id": "${nodeId}", "position": [${newPos.join(",")}], "rotation": [${newRot.join(",")}]} `);
        }
    };

    if (!nodeData) return null;

    return (
        <Interactive
            onHover={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
            onSelectEnd={handleSelectEnd}
        >
            <group 
                ref={groupRef} 
                position={nodeData.transform.position}
                rotation={nodeData.transform.rotation}
                scale={nodeData.transform.scale}
            >
                <group scale={isHovered ? 1.02 : 1}>
                    {children}
                </group>

                {/* Mathematical AABB Feedback */}
                {isColliding && (
                    <mesh>
                        <boxGeometry args={[1.05, 1.05, 1.05]} />
                        <meshBasicMaterial color="#ef4444" wireframe opacity={0.8} transparent />
                    </mesh>
                )}
            </group>
        </Interactive>
    );
}
