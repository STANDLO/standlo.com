"use client";

import { useRef } from "react";
import { CanvasEntity, useCanvasStore } from "./store";
import { ThreeEvent, useFrame, useLoader } from "@react-three/fiber";
import { TransformControls, Sphere } from "@react-three/drei";
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

    // Determine if entity should be hidden by assembly timeline
    const isHidden = playbackStep !== null && typeof entity.order === "number" && entity.order > playbackStep;

    const isSelected = selectedEntityId === entity.id;

    const isParametricBox = entity.baseEntityId.startsWith("parametric_box");
    const isParametricCyl = entity.baseEntityId.startsWith("parametric_cylinder");
    const isCustomMesh = (entity.type as string) === "mesh" && entity.metadata;

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
        if (isSelected && rigidBodyRef.current && groupRef.current) {
            // Keep the kinematic rigid body strictly synced with the visual group dragged by TransformControls
            rigidBodyRef.current.setNextKinematicTranslation(groupRef.current.position);
            rigidBodyRef.current.setNextKinematicRotation(groupRef.current.quaternion);
        }
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

    const colorBox = entity.isColliding ? "#ef4444" : (isSelected ? "#3b82f6" : "#e2e8f0");
    const colorCyl = entity.isColliding ? "#ef4444" : (isSelected ? "#3b82f6" : "#cbd5e1");
    const colorWf = entity.isColliding ? "#ef4444" : (isSelected ? "#3b82f6" : "#a1a1aa");

    return (
        <>
            <group
                ref={groupRef}
                position={entity.position}
                quaternion={entity.rotation}
                onClick={handleClick}
                visible={!isHidden}
            >
                {/* 
                  Rapier needs at least one body to be Kinematic to detect collisions with Fixed bodies.
                  We make the currently selected (dragged) body Kinematic.
                  ActiveEvents.COLLISION_EVENTS is implied by callbacks.
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
                                color={entity.meshOverrides?.['$root']?.color || colorBox}
                                roughness={0.8}
                            />
                        </mesh>
                    )}

                    {isParametricCyl && !isCustomMesh && (
                        <mesh castShadow receiveShadow>
                            <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
                            <meshStandardMaterial
                                color={entity.meshOverrides?.['$root']?.color || colorCyl}
                                metalness={0.5}
                                roughness={0.2}
                            />
                        </mesh>
                    )}

                    {!isParametricBox && !isParametricCyl && !isCustomMesh && (
                        <mesh castShadow receiveShadow>
                            <boxGeometry args={[1, 1, 1]} />
                            <meshStandardMaterial color={entity.meshOverrides?.['$root']?.color || colorWf} wireframe />
                        </mesh>
                    )}

                    {isCustomMesh && entity.metadata && (
                        <mesh castShadow receiveShadow>
                            {entity.metadata.geometry === "box" && <boxGeometry args={entity.metadata.args as [number, number, number]} />}
                            {entity.metadata.geometry === "sphere" && <sphereGeometry args={entity.metadata.args as [number, number, number]} />}
                            {entity.metadata.geometry === "cylinder" && <cylinderGeometry args={entity.metadata.args as [number, number, number, number]} />}
                            <meshStandardMaterial
                                color={isSelected ? "#3b82f6" : entity.meshOverrides?.['$root']?.color || entity.metadata.color || "#ffffff"}
                                map={textureMap || null}
                                roughness={entity.metadata.roughness ?? 0.5}
                                metalness={entity.metadata.metalness ?? 0.1}
                                emissive={entity.isColliding ? "#ef4444" : "#000000"}
                                emissiveIntensity={entity.isColliding ? 0.5 : 0}
                            />
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

            {isSelected && (
                <TransformControls
                    object={groupRef}
                    mode="translate"
                    onMouseUp={handleMouseUp}
                    // Snap to grid of 0.5 units
                    translationSnap={0.5}
                    rotationSnap={Math.PI / 4}
                />
            )}
        </>
    );
}
