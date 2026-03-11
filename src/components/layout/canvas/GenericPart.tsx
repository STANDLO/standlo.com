"use client";

import { useRef } from "react";
import { CanvasEntity, useCanvasStore } from "./store";
import { ThreeEvent, useFrame, useLoader } from "@react-three/fiber";
import { TransformControls, Sphere, Edges } from "@react-three/drei";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

interface GenericPartProps {
    entity: CanvasEntity;
}

export default function GenericPart({ entity }: GenericPartProps) {
    const groupRef = useRef<THREE.Group>(null!);
    const rigidBodyRef = useRef<RapierRigidBody>(null);

    const selectedEntityId = useCanvasStore((state) => state.selectedEntityId);
    const selectEntity = useCanvasStore((state) => state.selectEntity);
    const updateEntityPosition = useCanvasStore((state) => state.updateEntityPosition);
    const updateEntityRotation = useCanvasStore((state) => state.updateEntityRotation);

    const setEntityCollision = useCanvasStore((state) => state.setEntityCollision);
    const playbackStep = useCanvasStore((state) => state.playbackStep);

    const transformMode = useCanvasStore((state) => state.transformMode);
    const shadingMode = useCanvasStore((state) => state.shadingMode);
    const hoverSnap = useCanvasStore((state) => state.hoverSnap);
    const setHoverSnap = useCanvasStore((state) => state.setHoverSnap);
    const snapSource = useCanvasStore((state) => state.snapSource);
    const setSnapSource = useCanvasStore((state) => state.setSnapSource);
    const setTransformMode = useCanvasStore((state) => state.setTransformMode);
    const activeLayer = useCanvasStore((state) => state.activeLayer);

    const isFaded = activeLayer !== null && activeLayer !== entity.layerId;
    const opacity = isFaded ? 0.15 : 1;
    const transparent = opacity < 1;

    // Determine if entity should be hidden by assembly timeline
    const isHidden = playbackStep !== null && typeof entity.order === "number" && entity.order > playbackStep;

    const isSelected = selectedEntityId === entity.id;

    const isParametricBox = entity.baseEntityId.startsWith("parametric_box");
    const isParametricCyl = entity.baseEntityId.startsWith("parametric_cylinder");
    const isCustomMesh = ["mesh", "part", "assembly", "stand"].includes(entity.type as string) && !!entity.metadata?.geometry;

    const dimensions = [1, 1, 1] as [number, number, number];

    // Read applied texture URL and mapping properties prioritizing overrides
    const appliedTextureUrl = entity.meshOverrides?.['$root']?.textureUrl || entity.metadata?.textureUrl || null;
    const appliedRepeat = entity.meshOverrides?.['$root']?.textureRepeat || entity.metadata?.textureRepeat || null;
    const appliedWrapSStr = entity.meshOverrides?.['$root']?.textureWrapS || entity.metadata?.textureWrapS || null;
    const appliedWrapTStr = entity.meshOverrides?.['$root']?.textureWrapT || entity.metadata?.textureWrapT || null;

    const textureMapOriginal = useLoader(THREE.TextureLoader, appliedTextureUrl ? [appliedTextureUrl as string] : [])[0];
    const textureMap = textureMapOriginal ? textureMapOriginal.clone() : null;

    // Configure Texture properties
    if (textureMap) {
        textureMap.wrapS = appliedWrapSStr === "RepeatWrapping" ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
        textureMap.wrapT = appliedWrapTStr === "RepeatWrapping" ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
        if (Array.isArray(appliedRepeat) && appliedRepeat.length === 2) {
            textureMap.repeat.set(appliedRepeat[0], appliedRepeat[1]);
        }
        textureMap.needsUpdate = true;
    }

    useFrame(() => {
        // We do not manually setNextKinematicTranslation when the RigidBody is a child of the group being transformed.
        // react-three-rapier handles syncing the rigid body's absolute position relative to the moving parent group natively.
        // Calling it manually with groupRef.current.position (which is local/world mixed context) causes double-offsets and drifts from the TransformControls cursor.
    });

    const handleClick = (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        selectEntity(entity.id);
    };

    const handleMouseUp = () => {
        if (!groupRef.current) return;

        groupRef.current.updateMatrixWorld(true);
        const finalPos = groupRef.current.position.clone();
        const finalRot = groupRef.current.quaternion.clone();

        // --- Hierarchical Snap Logic ---
        const SNAP_DISTANCE = 0.5;
        let closestDist = Infinity;
        const snapDelta = new THREE.Vector3();
        let shouldSnap = false;

        const allEntities = useCanvasStore.getState().entities;

        // Compare our sockets with all other entities' sockets
        if (entity.sockets && entity.sockets.length > 0) {
            for (const mySoc of entity.sockets) {
                // Get our socket's world position
                const mySocLocal = new THREE.Vector3(...mySoc.position);
                const mySocWorld = groupRef.current.localToWorld(mySocLocal.clone());

                for (const otherEntity of Object.values(allEntities)) {
                    if (otherEntity.id === entity.id) continue;
                    if (!otherEntity.sockets) continue;

                    for (const otherSoc of otherEntity.sockets) {
                        // Check compatibility (naive: male to female, neutral to neutral)
                        if (
                            (mySoc.type === "male" && otherSoc.type !== "female") ||
                            (mySoc.type === "female" && otherSoc.type !== "male") ||
                            (mySoc.type === "neutral" && otherSoc.type !== "neutral")
                        ) continue;

                        // Calculate other socket's world pos
                        const otherPos = new THREE.Vector3(...otherEntity.position);
                        const otherRot = new THREE.Quaternion(...otherEntity.rotation);
                        const otherSocWorld = new THREE.Vector3(...otherSoc.position)
                            .applyQuaternion(otherRot)
                            .add(otherPos);

                        const dist = mySocWorld.distanceTo(otherSocWorld);

                        // We found a better snap candidate!
                        if (dist < SNAP_DISTANCE && dist < closestDist) {
                            closestDist = dist;
                            // We want: finalPos = currentPos + (otherSocWorld - mySocWorld)
                            snapDelta.subVectors(otherSocWorld, mySocWorld);
                            shouldSnap = true;
                        }
                    }
                }
            }
        }

        if (shouldSnap) {
            finalPos.add(snapDelta);
            // Also update the visual transform immediately to avoid jitter
            groupRef.current.position.copy(finalPos);
        }

        // Update Store
        updateEntityPosition(entity.id, [finalPos.x, finalPos.y, finalPos.z]);
        updateEntityRotation(entity.id, [finalRot.x, finalRot.y, finalRot.z, finalRot.w]);
    };

    const handleSnapInteractionMove = (e: ThreeEvent<MouseEvent>) => {
        if (transformMode !== 'snap') return;
        e.stopPropagation();

        const obj = e.eventObject; // e.object points to the specific geometry mesh, what if it's the bounding box? The `GenericPart` group is better represented by e.eventObject
        const localPoint = obj.worldToLocal(e.point.clone());
        
        // Define exact visual limits
        const targetDims = (entity.metadata?.dimensions as [number, number, number]) || dimensions;

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

        const sx = snapToNearest(localPoint.x, targetDims[0]);
        const sy = snapToNearest(localPoint.y, targetDims[1]);
        const sz = snapToNearest(localPoint.z, targetDims[2]); 

        const isMidpoint = Math.abs(sx) < 1e-4 || Math.abs(sy) < 1e-4 || Math.abs(sz) < 1e-4;
        const pointType: 'corner' | 'midpoint' = isMidpoint ? 'midpoint' : 'corner';

        const snappedLocal = new THREE.Vector3(sx, sy, sz);
        const snappedWorld = obj.localToWorld(snappedLocal.clone());

        const normalLocal = e.face?.normal || new THREE.Vector3(0, 1, 0);
        const normalMat = new THREE.Matrix3().getNormalMatrix(obj.matrixWorld);
        const normalWorld = normalLocal.clone().applyMatrix3(normalMat).normalize();

        setHoverSnap({
            id: entity.id,
            point: [snappedWorld.x, snappedWorld.y, snappedWorld.z],
            normal: [normalWorld.x, normalWorld.y, normalWorld.z],
            type: pointType
        });
    };

    const handleSnapInteractionClick = (e: ThreeEvent<MouseEvent>) => {
        if (transformMode !== 'snap') return;
        e.stopPropagation();
        if (!hoverSnap) return;

        if (!snapSource) {
            setSnapSource(hoverSnap);
        } else {
            if (snapSource.id === hoverSnap.id) {
                setSnapSource(null);
                return;
            }
            // Execute snap by moving source object

            const sourceEntity = useCanvasStore.getState().entities[snapSource.id];
            if (sourceEntity) {
                const pA = new THREE.Vector3(...snapSource.point);
                const pB = new THREE.Vector3(...hoverSnap.point);
                const translation = pB.clone().sub(pA);
                const center = new THREE.Vector3(...sourceEntity.position);
                const newPos = center.clone().add(translation);

                useCanvasStore.getState().updateEntityPosition(sourceEntity.id, [newPos.x, newPos.y, newPos.z]);
            }

            setSnapSource(null);
            setHoverSnap(null);
            setTransformMode('translate');
        }
    };

    const handleClickWrapper = (e: ThreeEvent<MouseEvent>) => {
        if (isFaded) return;
        if (transformMode === 'snap') {
            handleSnapInteractionClick(e);
        } else {
            handleClick(e);
        }
    };

    const colorBox = entity.isColliding ? "#ef4444" : (isSelected ? "#3b82f6" : "#e2e8f0");
    const colorCyl = entity.isColliding ? "#ef4444" : (isSelected ? "#3b82f6" : "#cbd5e1");
    const colorWf = entity.isColliding ? "#ef4444" : (isSelected ? "#3b82f6" : "#a1a1aa");

    // Dynamic resolution of the visual bounds from fetched metadata (for catalog items)
    const entityDims = (entity as unknown as Record<string, unknown>).dimensions as [number, number, number] | undefined;
    const renderDims = (entity.metadata?.dimensions as [number, number, number]) 
        || (entity.metadata?.args as [number, number, number]) 
        || entityDims
        || dimensions;

    return (
        <>
            <group
                ref={groupRef}
                position={entity.position}
                quaternion={entity.rotation}
                onClick={handleClickWrapper}
                onPointerMove={(e) => {
                    if (isFaded) return;
                    if (transformMode === 'snap') {
                        handleSnapInteractionMove(e);
                    }
                }}
                onPointerOver={(e) => {
                    if (isFaded) return;
                    e.stopPropagation();
                    if (transformMode === 'snap') {
                        document.body.style.cursor = 'crosshair';
                    } else {
                        document.body.style.cursor = 'pointer';
                    }
                }}
                onPointerOut={() => {
                    if (isFaded) return;
                    if (transformMode === 'snap') {
                        setHoverSnap(null);
                    }
                    document.body.style.cursor = 'auto';
                }}
                visible={!isHidden}
            >
                {/* 
                  Rapier needs at least one body to be Kinematic to detect collisions with Fixed bodies.
                  We make the currently selected (dragged) body Kinematic.
                */}
                <RigidBody
                    ref={rigidBodyRef}
                    type={isSelected ? "kinematicPosition" : "fixed"}
                    colliders="cuboid"
                    onCollisionEnter={() => setEntityCollision(entity.id, true)}
                    onCollisionExit={() => setEntityCollision(entity.id, false)}
                >
                    {isParametricBox && !isCustomMesh && (
                        <mesh castShadow receiveShadow>
                            <boxGeometry args={dimensions} />
                            <meshStandardMaterial
                                color={shadingMode === 'white_edges' ? "#ffffff" : (entity.meshOverrides?.['$root']?.color || colorBox)}
                                roughness={0.8}
                                emissive={isSelected ? "#3b82f6" : "#000000"}
                                emissiveIntensity={isSelected ? 0.3 : 0}
                                transparent={transparent}
                                opacity={opacity}
                            />
                            {shadingMode !== "shaded" && <Edges threshold={15} color={isFaded ? "gray" : "black"} />}
                        </mesh>
                    )}

                    {isParametricCyl && !isCustomMesh && (
                        <mesh castShadow receiveShadow>
                            <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
                            <meshStandardMaterial
                                color={shadingMode === 'white_edges' ? "#ffffff" : (entity.meshOverrides?.['$root']?.color || colorCyl)}
                                metalness={0.5}
                                roughness={0.2}
                                emissive={isSelected ? "#3b82f6" : "#000000"}
                                emissiveIntensity={isSelected ? 0.3 : 0}
                                transparent={transparent}
                                opacity={opacity}
                            />
                            {shadingMode !== "shaded" && <Edges threshold={15} color={isFaded ? "gray" : "black"} />}
                        </mesh>
                    )}

                    {!isParametricBox && !isParametricCyl && !isCustomMesh && (
                        <mesh castShadow receiveShadow>
                            <boxGeometry args={[renderDims[0], renderDims[2] ?? renderDims[1], renderDims[1] ?? renderDims[2]]} />
                            <meshStandardMaterial color={entity.meshOverrides?.['$root']?.color || colorWf} wireframe transparent={transparent} opacity={opacity} />
                        </mesh>
                    )}

                    {isCustomMesh && entity.metadata && (
                        <mesh castShadow receiveShadow>
                            {entity.metadata.geometry === "box" && <boxGeometry args={[renderDims[0], renderDims[2] ?? renderDims[1], renderDims[1] ?? renderDims[2]]} />}
                            {entity.metadata.geometry === "sphere" && <sphereGeometry args={entity.metadata.args as [number, number, number]} />}
                            {entity.metadata.geometry === "cylinder" && <cylinderGeometry args={entity.metadata.args as [number, number, number, number]} />}
                            <meshStandardMaterial
                                color={shadingMode === 'white_edges' ? "#ffffff" : (isSelected ? "#3b82f6" : entity.meshOverrides?.['$root']?.color || entity.metadata.color || colorBox)}
                                map={textureMap || null}
                                roughness={entity.metadata.roughness ?? 0.5}
                                metalness={entity.metadata.metalness ?? 0.1}
                                emissive={entity.isColliding ? "#ef4444" : (isSelected ? "#3b82f6" : "#000000")}
                                emissiveIntensity={entity.isColliding ? 0.5 : (isSelected ? 0.3 : 0)}
                                transparent={transparent}
                                opacity={opacity}
                            />
                            {shadingMode !== "shaded" && <Edges threshold={15} color={isFaded ? "gray" : "black"} />}
                        </mesh>
                    )}
                </RigidBody>

                {/* Render Connectors/Sockets as small colored spheres if selected */}
                {isSelected && entity.sockets && entity.sockets.map(soc => (
                    <Sphere key={soc.id} args={[0.08, 16, 16]} position={soc.position}>
                        <meshBasicMaterial
                            color={soc.type === "male" ? "#3b82f6" : soc.type === "female" ? "#ec4899" : "#ffffff"}
                            transparent
                            opacity={0.8}
                        />
                    </Sphere>
                ))}
            </group>

            {isSelected && transformMode !== 'snap' && (
                <TransformControls
                    object={groupRef}
                    mode={transformMode === 'rotate' ? 'rotate' : 'translate'}
                    onMouseUp={handleMouseUp}
                    // Snap to grid of 0.05 units for finer movement, similar to admin interface
                    translationSnap={0.05}
                    rotationSnap={Math.PI / 12} // 15 degrees
                />
            )}
        </>
    );
}
