"use client";

import { useRef, useMemo, useEffect } from "react";
import { CanvasEntity, useDesignStore } from "@/lib/zustand";
import { useLoader, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

interface InstancedPartGroupProps {
    entities: CanvasEntity[];
}

export default function InstancedPartGroup({ entities }: InstancedPartGroupProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const selectEntity = useDesignStore((state) => state.selectEntity);
    const shadingMode = useDesignStore((state) => state.shadingMode);

    // Use the first entity to determine shared properties
    const firstEntity = entities[0];
    const isParametricBox = firstEntity.baseEntityId.startsWith("parametric_box");
    const isParametricCyl = firstEntity.baseEntityId.startsWith("parametric_cylinder");
    const isCustomMesh = ["mesh", "part", "assembly", "design"].includes(firstEntity.type as string) && !!firstEntity.metadata?.geometry;

    const dimensions = [1, 1, 1] as [number, number, number];

    const entityDims = (firstEntity as unknown as Record<string, unknown>).dimensions as [number, number, number] | undefined;
    const renderDims = (firstEntity.metadata?.dimensions as [number, number, number]) 
        || (firstEntity.metadata?.args as [number, number, number]) 
        || entityDims
        || dimensions;

    const textureUrl = firstEntity.metadata?.textureUrl || null;
    const textureMapOriginal = useLoader(THREE.TextureLoader, textureUrl ? [textureUrl as string] : [])[0];
    const textureMap = useMemo(() => {
        if (!textureMapOriginal) return null;
        const map = textureMapOriginal.clone();
        map.wrapS = firstEntity.metadata?.textureWrapS === "RepeatWrapping" ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
        map.wrapT = firstEntity.metadata?.textureWrapT === "RepeatWrapping" ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
        const appliedRepeat = firstEntity.metadata?.textureRepeat;
        if (Array.isArray(appliedRepeat) && appliedRepeat.length === 2) {
            map.repeat.set(appliedRepeat[0], appliedRepeat[1]);
        }
        map.needsUpdate = true;
        return map;
    }, [textureMapOriginal, firstEntity.metadata]);

    const colorDefault = isParametricBox ? "#e2e8f0" : isParametricCyl ? "#cbd5e1" : "#a1a1aa";
    const finalColor = shadingMode === 'white_edges' ? "#ffffff" : (firstEntity.metadata?.color || colorDefault);

    useEffect(() => {
        if (!meshRef.current) return;
        const dummy = new THREE.Object3D();
        
        entities.forEach((entity, i) => {
            dummy.position.set(entity.position[0], entity.position[1], entity.position[2]);
            dummy.quaternion.set(entity.rotation[0], entity.rotation[1], entity.rotation[2], entity.rotation[3]);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
            
            // Optionally, we could use `.setColorAt` if we wanted per-instance colors in the future
        });
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }, [entities]);

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (e.instanceId !== undefined) {
            const clickedEntity = entities[e.instanceId];
            if (clickedEntity) {
                selectEntity(clickedEntity.id);
            }
        }
    };
    
    const renderGeometry = () => {
        if (isParametricBox && !isCustomMesh) {
            return <boxGeometry args={dimensions} />;
        } else if (isParametricCyl && !isCustomMesh) {
            return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
        } else if (!isParametricBox && !isParametricCyl && !isCustomMesh) {
            return <boxGeometry args={[renderDims[0], renderDims[2] ?? renderDims[1], renderDims[1] ?? renderDims[2]]} />;
        } else if (isCustomMesh && firstEntity.metadata) {
            if (firstEntity.metadata.geometry === "box") {
                return <boxGeometry args={[renderDims[0], renderDims[2] ?? renderDims[1], renderDims[1] ?? renderDims[2]]} />;
            } else if (firstEntity.metadata.geometry === "sphere") {
                return <sphereGeometry args={firstEntity.metadata.args as [number, number, number]} />;
            } else if (firstEntity.metadata.geometry === "cylinder") {
                return <cylinderGeometry args={firstEntity.metadata.args as [number, number, number, number]} />;
            }
        }
        return null;
    };

    const geom = renderGeometry();
    if (!geom) return null;

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, entities.length]}
            onClick={handleClick}
            onPointerDown={(e) => {
                // Instanced Mesh dragging requires lifting the single grouped entity's pos
                e.stopPropagation();
                if (e.instanceId !== undefined) {
                    const store = useDesignStore.getState();
                    if (store.transformMode !== 'snap') {
                        (e.target as Element).setPointerCapture(e.pointerId);
                        store.setIsDragging(true);
                    }
                }
            }}
            onPointerUp={(e) => {
                const store = useDesignStore.getState();
                if (store.isDragging) {
                    e.stopPropagation();
                    (e.target as Element).releasePointerCapture(e.pointerId);
                    store.setIsDragging(false);
                    // Single mesh drop updating matrix logic is complex for instanced meshes.
                    // Usually we isolate dragged elements out of InstancedMesh (done via DesignStore removing it from "grouped") 
                    // and let GenericPart handle it. Here we just release capture safely.
                }
            }}
            onPointerMove={(e) => {
                const store = useDesignStore.getState();
                if (store.isDragging && e.ray && e.instanceId !== undefined) {
                    e.stopPropagation();
                    const clickedEntity = entities[e.instanceId];
                    if (clickedEntity && store.selectedEntityId === clickedEntity.id) {
                         // Dragging an instanced part updates it's isolated position
                         store.updateEntityPosition(clickedEntity.id, [e.point.x, e.point.y, e.point.z]);
                    }
                }
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={() => {
                document.body.style.cursor = 'auto';
            }}
            castShadow
            receiveShadow
        >
            {geom}
            <meshPhysicalMaterial
                color={finalColor}
                map={textureMap || null}
                roughness={firstEntity.metadata?.roughness ?? 0.8}
                metalness={firstEntity.metadata?.metalness ?? 0}
                clearcoat={firstEntity.metadata?.clearcoat ?? 0}
                clearcoatRoughness={firstEntity.metadata?.clearcoatRoughness ?? 0}
                sheen={firstEntity.metadata?.sheen ?? 0}
                sheenRoughness={firstEntity.metadata?.sheenRoughness ?? 0}
                transmission={firstEntity.metadata?.transmission ?? 0}
                ior={firstEntity.metadata?.ior ?? 1.5}
                transparent={!!firstEntity.metadata?.transmission}
            />
            {/* Edges don't work trivially on instancedMesh without custom shaders, out of scope for now */}
        </instancedMesh>
    );
}
