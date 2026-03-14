"use client";

import { useRef, useMemo } from "react";
import { CanvasEntity, useDesignStore } from "@/lib/zustand";
import { ThreeEvent, useFrame, useLoader } from "@react-three/fiber";
import { TransformControls, Sphere, Edges } from "@react-three/drei";
import * as THREE from "three";

interface GenericPartProps {
    entity: CanvasEntity;
}

export default function GenericPart({ entity }: GenericPartProps) {
    const groupRef = useRef<THREE.Group>(null!);

    const selectedEntityId = useDesignStore((state) => state.selectedEntityId);
    const selectEntity = useDesignStore((state) => state.selectEntity);
    const updateEntityPosition = useDesignStore((state) => state.updateEntityPosition);
    const updateEntityRotation = useDesignStore((state) => state.updateEntityRotation);
    const playbackStep = useDesignStore((state) => state.playbackStep);
    const setLiveCommand = useDesignStore((state) => state.setLiveCommand);

    const transformMode = useDesignStore((state) => state.transformMode);
    const shadingMode = useDesignStore((state) => state.shadingMode);
    const hoverSnap = useDesignStore((state) => state.hoverSnap);
    const setHoverSnap = useDesignStore((state) => state.setHoverSnap);
    const snapSource = useDesignStore((state) => state.snapSource);
    const setSnapSource = useDesignStore((state) => state.setSnapSource);
    const setTransformMode = useDesignStore((state) => state.setTransformMode);
    const activeLayer = useDesignStore((state) => state.activeLayer);
    
    const isDragging = useDesignStore((state) => state.isDragging);
    const setIsDragging = useDesignStore((state) => state.setIsDragging);

    const isFaded = activeLayer !== null && activeLayer !== entity.layerId;
    const opacity = isFaded ? 0.15 : 1;
    const transparent = opacity < 1;

    // Determine if entity should be hidden by assembly timeline
    const isHidden = playbackStep !== null && typeof entity.order === "number" && entity.order > playbackStep;

    const isSelected = selectedEntityId === entity.id;

    const isParametricBox = entity.baseEntityId.startsWith("parametric_box");
    const isParametricCyl = entity.baseEntityId.startsWith("parametric_cylinder");
    const isCustomMesh = ["mesh", "part", "assembly", "design"].includes(entity.type as string) && !!entity.metadata?.geometry;

    const dimensions = [1, 1, 1] as [number, number, number];

    const materialsRegistry = useDesignStore((state) => state.materialsRegistry) as Record<string, unknown>[];
    const texturesRegistry = useDesignStore((state) => state.texturesRegistry) as Record<string, unknown>[];
    const entities = useDesignStore((state) => state.entities);

    const activeMaterial = useMemo(() => {
        if (!entity.metadata?.materialId) return null;
        return materialsRegistry.find(m => m.id === entity.metadata?.materialId) || null;
    }, [entity.metadata?.materialId, materialsRegistry]);

    const activeTexture = useMemo(() => {
        if (!entity.metadata?.textureId) return null;
        return texturesRegistry.find(t => t.id === entity.metadata?.textureId) || null;
    }, [entity.metadata?.textureId, texturesRegistry]);

    const getProp = (key: string, fallback: number): number => {
        const overrides = entity.meshOverrides?.['$root'] as Record<string, unknown> | undefined;
        const meta = entity.metadata as Record<string, unknown> | undefined;
        const activeMat = activeMaterial as Record<string, unknown> | undefined;
        
        if (typeof overrides?.[key] === 'number') return overrides[key] as number;
        if (typeof meta?.[key] === 'number') return meta[key] as number;
        if (typeof activeMat?.[key] === 'number') return activeMat[key] as number;
        return fallback;
    };

    const resolveColor = (defaultColor: string): string => {
        const overrides = entity.meshOverrides?.['$root'] as Record<string, unknown> | undefined;
        const meta = entity.metadata as Record<string, unknown> | undefined;
        
        if (shadingMode === 'white_edges') return "#ffffff";
        if (typeof overrides?.color === 'string') return overrides.color;
        if (typeof meta?.color === 'string') return meta.color;
        if (activeTexture?.type === 'color' && typeof activeTexture.valueLight === 'string') return activeTexture.valueLight;
        if (typeof activeMaterial?.baseColor === 'string') return activeMaterial.baseColor;
        return defaultColor;
    };

    // Read applied texture URL and mapping properties prioritizing overrides
    const appliedTextureUrl = entity.meshOverrides?.['$root']?.textureUrl || entity.metadata?.textureUrl || (activeTexture?.type === 'image' ? activeTexture.url : null) || null;
    const appliedRepeat = entity.meshOverrides?.['$root']?.textureRepeat || entity.metadata?.textureRepeat || activeTexture?.repeat || null;
    const appliedWrapSStr = entity.meshOverrides?.['$root']?.textureWrapS || entity.metadata?.textureWrapS || activeTexture?.wrapS || null;
    const appliedWrapTStr = entity.meshOverrides?.['$root']?.textureWrapT || entity.metadata?.textureWrapT || activeTexture?.wrapT || null;
    const setEntityCollision = useDesignStore((state) => state.setEntityCollision);
    // Reuse these to avoid gc overhead
    const myBox = useMemo(() => new THREE.Box3(), []);
    const otherBox = useMemo(() => new THREE.Box3(), []);

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
        if (isSelected && transformMode !== 'snap' && groupRef.current) {
            if (isDragging) {
                myBox.setFromObject(groupRef.current);
                let collision = false;
                
                for (const [id, otherEntity] of Object.entries(entities)) {
                    if (id === entity.id) continue;
                    
                    const otherIsHidden = playbackStep !== null && typeof otherEntity.order === "number" && otherEntity.order > playbackStep;
                    if (otherIsHidden) continue;

                    const otherEntityWithDims = otherEntity as CanvasEntity & { dimensions?: [number, number, number] };
                    const otherEntityDims = (otherEntity.metadata?.dimensions as [number, number, number]) 
                        || (otherEntity.metadata?.args as [number, number, number]) 
                        || otherEntityWithDims.dimensions 
                        || [1, 1, 1];
                    
                    const szX = otherEntityDims[0];
                    const szY = otherEntityDims[2] ?? otherEntityDims[1];
                    const szZ = otherEntityDims[1] ?? otherEntityDims[2];

                    const min = new THREE.Vector3(
                        otherEntity.position[0] - szX / 2,
                        otherEntity.position[1] - szY / 2,
                        otherEntity.position[2] - szZ / 2
                    );
                    const max = new THREE.Vector3(
                        otherEntity.position[0] + szX / 2,
                        otherEntity.position[1] + szY / 2,
                        otherEntity.position[2] + szZ / 2
                    );
                    
                    otherBox.set(min, max);
                    
                    if (myBox.intersectsBox(otherBox)) {
                        collision = true;
                        break;
                    }
                }

                if (collision !== entity.isColliding) {
                    setEntityCollision(entity.id, collision);
                }
            } else if (!isDragging && entity.isColliding) {
                // Clear collision styling on drop
                setEntityCollision(entity.id, false);
            }
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

        const allEntities = useDesignStore.getState().entities;

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

        if (shouldSnap && !Number.isNaN(snapDelta.x) && !Number.isNaN(snapDelta.y) && !Number.isNaN(snapDelta.z)) {
            finalPos.add(snapDelta);
            // Also update the visual transform immediately to avoid jitter
            groupRef.current.position.copy(finalPos);
        }

        // Update Store only if valid numbers
        if (!Number.isNaN(finalPos.x) && !Number.isNaN(finalPos.y) && !Number.isNaN(finalPos.z) &&
            !Number.isNaN(finalRot.x) && !Number.isNaN(finalRot.y) && !Number.isNaN(finalRot.z) && !Number.isNaN(finalRot.w)) {
            updateEntityPosition(entity.id, [finalPos.x, finalPos.y, finalPos.z]);
            updateEntityRotation(entity.id, [finalRot.x, finalRot.y, finalRot.z, finalRot.w]);
        }
    };

    const handleSnapInteractionMove = (e: ThreeEvent<MouseEvent>) => {
        if (transformMode !== 'snap') return;
        e.stopPropagation();

        const targetDims = (entity.metadata?.dimensions as [number, number, number]) 
            || (entity.metadata?.args as [number, number, number]) 
            || ((entity as unknown as Record<string, unknown>).dimensions as [number, number, number]) 
            || dimensions;
            
        const geoArgs = [targetDims[0], targetDims[2] ?? targetDims[1], targetDims[1] ?? targetDims[2]];

        // Create a matrix from entity.position and entity.rotation
        const matrixWorld = new THREE.Matrix4();
        const position = new THREE.Vector3(...entity.position);
        const quaternion = new THREE.Quaternion(...entity.rotation);
        const scale = new THREE.Vector3(1, 1, 1);
        matrixWorld.compose(position, quaternion, scale);

        const matrixWorldInverse = matrixWorld.clone().invert();
        
        // Convert e.point to local
        const localPoint = e.point.clone().applyMatrix4(matrixWorldInverse);

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

        const sx = snapToNearest(localPoint.x, geoArgs[0]);
        const sy = snapToNearest(localPoint.y, geoArgs[1]);
        const sz = snapToNearest(localPoint.z, geoArgs[2]); 

        const isMidpoint = Math.abs(sx) < 1e-4 || Math.abs(sy) < 1e-4 || Math.abs(sz) < 1e-4;
        const pointType: 'corner' | 'midpoint' = isMidpoint ? 'midpoint' : 'corner';

        const snappedLocal = new THREE.Vector3(sx, sy, sz);
        const snappedWorld = snappedLocal.clone().applyMatrix4(matrixWorld);

        const normalLocal = e.face?.normal || new THREE.Vector3(0, 1, 0);
        const normalMat = new THREE.Matrix3().getNormalMatrix(matrixWorld);
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

            const sourceEntity = useDesignStore.getState().entities[snapSource.id];
            if (sourceEntity) {
                const pA = new THREE.Vector3(...snapSource.point);
                const pB = new THREE.Vector3(...hoverSnap.point);
                const translation = pB.clone().sub(pA);
                const center = new THREE.Vector3(...sourceEntity.position);
                const newPos = center.clone().add(translation);

                useDesignStore.getState().updateEntityPosition(sourceEntity.id, [newPos.x, newPos.y, newPos.z]);
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


    // Dynamic resolution of the visual bounds from fetched metadata (for catalog items)
    const entityDims = (entity as unknown as Record<string, unknown>).dimensions as [number, number, number] | undefined;
    const renderDims = (entity.metadata?.dimensions as [number, number, number]) 
        || (entity.metadata?.args as [number, number, number]) 
        || entityDims
        || dimensions;

    return (
        <>
            {/* The Target for TransformControls and Sockets */}
            <group
                ref={groupRef}
                position={entity.position}
                quaternion={entity.rotation}
            >
                {/* Render Connectors/Sockets as small colored spheres if selected */}
                {isSelected && entity.sockets && entity.sockets.map(soc => (
                    <Sphere key={soc.id} args={[0.08, 16, 16]} position={soc.position}>
                        <meshBasicMaterial
                            color={soc.type === "male" ? "#3b82f6" : soc.type === "female" ? "#ec4899" : "#22c55e"}
                            transparent
                            opacity={0.8}
                        />
                    </Sphere>
                ))}

                {/* The Visual Body */}
                <group
                    onClick={handleClickWrapper}
                    onPointerDown={(e) => {
                        // Support native WebXR pointer dragging by hooking into pointer capture
                        if (transformMode !== 'snap') {
                            e.stopPropagation();
                            (e.target as Element).setPointerCapture(e.pointerId);
                            setIsDragging(true);
                        }
                    }}
                    onPointerUp={(e) => {
                        if (isDragging) {
                            e.stopPropagation();
                            (e.target as Element).releasePointerCapture(e.pointerId);
                            setIsDragging(false);
                            if (groupRef.current) {
                                const newPos = groupRef.current.position;
                                updateEntityPosition(entity.id, [newPos.x, newPos.y, newPos.z]);
                            }
                        }
                    }}
                    onPointerMove={(e) => {
                        if (isFaded) return;
                        if (isSelected && transformMode !== 'snap') {
                            // If dragging via VR pointer (which triggers PointerMove with capture)
                            if (isDragging && e.ray) {
                                // Basic translation on the drag plane (this works automatically because pointer capture routes movement to this element,
                                // but we need to translate the hit point.
                                // In a more advanced VR setup you attach the object to the controller ray, but for now we follow the pointer ray intersection.
                                if (groupRef.current) {
                                    groupRef.current.position.copy(e.point);
                                }
                            }
                            return;
                        }
                        if (transformMode === 'snap') {
                            handleSnapInteractionMove(e);
                        }
                    }}
                    onPointerOver={(e) => {
                        if (isFaded) return;
                        if (isSelected && transformMode !== 'snap') return;
                        e.stopPropagation();
                        if (transformMode === 'snap') {
                            document.body.style.cursor = 'crosshair';
                        } else {
                            document.body.style.cursor = 'pointer';
                        }
                    }}
                    onPointerOut={() => {
                        if (isFaded) return;
                        if (isSelected && transformMode !== 'snap') return;
                        if (transformMode === 'snap') {
                            setHoverSnap(null);
                        }
                        document.body.style.cursor = 'auto';
                    }}
                    visible={!isHidden}
                >
                    {isParametricBox && !isCustomMesh && (
                        <mesh castShadow receiveShadow>
                            <boxGeometry args={[renderDims[0], renderDims[2] ?? renderDims[1], renderDims[1] ?? renderDims[2]]} />
                            <meshPhysicalMaterial
                                color={resolveColor(colorBox)}
                                map={textureMap || null}
                                roughness={getProp('roughness', 0.8)}
                                metalness={getProp('metalness', 0)}
                                clearcoat={getProp('clearcoat', 0)}
                                clearcoatRoughness={getProp('clearcoatRoughness', 0)}
                                sheen={getProp('sheen', 0)}
                                sheenRoughness={getProp('sheenRoughness', 0)}
                                transmission={getProp('transmission', 0)}
                                ior={getProp('ior', 1.5)}
                                emissive={isSelected ? "#3b82f6" : "#000000"}
                                emissiveIntensity={isSelected ? 0.3 : 0}
                                transparent={transparent || !!getProp('transmission', 0)}
                                opacity={opacity}
                            />
                            {shadingMode !== "shaded" && <Edges threshold={15} color={isFaded ? "gray" : "black"} />}
                        </mesh>
                    )}

                    {isParametricCyl && !isCustomMesh && (
                        <mesh castShadow receiveShadow>
                            <cylinderGeometry args={[renderDims[0] / 2, renderDims[0] / 2, renderDims[2] ?? renderDims[1], 32]} />
                            <meshPhysicalMaterial
                                color={resolveColor(colorCyl)}
                                map={textureMap || null}
                                roughness={getProp('roughness', 0.2)}
                                metalness={getProp('metalness', 0.5)}
                                clearcoat={getProp('clearcoat', 0)}
                                clearcoatRoughness={getProp('clearcoatRoughness', 0)}
                                sheen={getProp('sheen', 0)}
                                sheenRoughness={getProp('sheenRoughness', 0)}
                                transmission={getProp('transmission', 0)}
                                ior={getProp('ior', 1.5)}
                                emissive={isSelected ? "#3b82f6" : "#000000"}
                                emissiveIntensity={isSelected ? 0.3 : 0}
                                transparent={transparent || !!getProp('transmission', 0)}
                                opacity={opacity}
                            />
                            {shadingMode !== "shaded" && <Edges threshold={15} color={isFaded ? "gray" : "black"} />}
                        </mesh>
                    )}

                    {!isParametricBox && !isParametricCyl && !isCustomMesh && (
                        <mesh castShadow receiveShadow>
                            <boxGeometry args={[renderDims[0], renderDims[2] ?? renderDims[1], renderDims[1] ?? renderDims[2]]} />
                            <meshPhysicalMaterial 
                                color={
                                    entity.type === 'sketch' ? '#22c55e' : // Green for Sketch
                                    entity.type === 'design' ? '#f43f5e' : // Rose for Design
                                    entity.type === 'bundle' ? '#a855f7' : // Purple for Bundle
                                    entity.type === 'assembly' ? '#3b82f6' : // Blue for Assembly
                                    '#10b981' // Emerald for Part / Mesh
                                }
                                transparent={entity.type === 'sketch' || entity.type === 'design' || entity.type === 'bundle' || entity.type === 'assembly' || transparent} 
                                opacity={entity.type === 'sketch' ? 0.3 : (entity.type === 'design' || entity.type === 'bundle' || entity.type === 'assembly' ? 0.15 : opacity)} 
                                depthWrite={!transparent} 
                                transmission={entity.type === 'design' || entity.type === 'bundle' || entity.type === 'assembly' ? 0.5 : 0}
                                thickness={1}
                            />
                            <Edges 
                                color={
                                entity.type === 'sketch' ? '#15803d' : // Solid dark green edge
                                entity.type === 'design' ? '#be123c' : 
                                entity.type === 'bundle' ? '#7e22ce' :
                                entity.type === 'assembly' ? '#1d4ed8' :
                                '#047857'
                                } />
                        </mesh>
                    )}

                    {isCustomMesh && entity.metadata && (
                        <mesh castShadow receiveShadow>
                            {entity.metadata.geometry === "box" && <boxGeometry args={[renderDims[0], renderDims[2] ?? renderDims[1], renderDims[1] ?? renderDims[2]]} />}
                            {entity.metadata.geometry === "sphere" && <sphereGeometry args={entity.metadata.args as [number, number, number]} />}
                            {entity.metadata.geometry === "cylinder" && <cylinderGeometry args={entity.metadata.args as [number, number, number, number]} />}
                            <meshPhysicalMaterial
                                color={isSelected ? "#3b82f6" : resolveColor(colorBox)}
                                map={textureMap || null}
                                roughness={getProp('roughness', 0.5)}
                                metalness={getProp('metalness', 0.1)}
                                clearcoat={getProp('clearcoat', 0)}
                                clearcoatRoughness={getProp('clearcoatRoughness', 0)}
                                sheen={getProp('sheen', 0)}
                                sheenRoughness={getProp('sheenRoughness', 0)}
                                transmission={getProp('transmission', 0)}
                                ior={getProp('ior', 1.5)}
                                emissive={entity.isColliding ? "#ef4444" : (isSelected ? "#3b82f6" : "#000000")}
                                emissiveIntensity={entity.isColliding ? 0.5 : (isSelected ? 0.3 : 0)}
                                transparent={transparent || !!getProp('transmission', 0)}
                                opacity={opacity}
                            />
                            {shadingMode !== "shaded" && <Edges threshold={15} color={isFaded ? "gray" : "black"} />}
                        </mesh>
                    )}
                </group>
            </group>

            {isSelected && transformMode !== 'snap' && (
                <TransformControls
                    object={groupRef}
                    mode={transformMode === 'rotate' ? 'rotate' : 'translate'}
                    onMouseDown={() => setIsDragging(true)}
                    onChange={() => {
                        if (groupRef.current) {
                            const pos = groupRef.current.position;
                            const rot = groupRef.current.rotation; 
                            const action = transformMode === 'rotate' ? '#rotate' : '#move';
                            const target = entity.metadata?.name ? entity.metadata.name.replace(/\s+/g, '_') : entity.id.substring(0, 8);
                            
                            const px = (Math.round(pos.x * 1000) / 1000);
                            const py = (Math.round(pos.y * 1000) / 1000);
                            const pz = (Math.round(pos.z * 1000) / 1000);

                            const rx = (Math.round(THREE.MathUtils.radToDeg(rot.x) * 1000) / 1000);
                            const ry = (Math.round(THREE.MathUtils.radToDeg(rot.y) * 1000) / 1000);
                            const rz = (Math.round(THREE.MathUtils.radToDeg(rot.z) * 1000) / 1000);

                            let cmd = `@${target} ${action} `;
                            if (transformMode === 'rotate') {
                                cmd += `/x${rx} /y${ry} /z${rz}`;
                            } else {
                                cmd += `/x${px} /y${py} /z${pz}`;
                            }
                            setLiveCommand(cmd);
                        }
                    }}
                    onMouseUp={() => {
                        setIsDragging(false);
                        setLiveCommand(null); // Clear the live stream to let the terminal input persist if needed
                        handleMouseUp();
                    }}
                    // Snap to grid of 0.05 units for finer movement, similar to admin interface
                    translationSnap={0.05}
                    rotationSnap={Math.PI / 12} // 15 degrees
                />
            )}
        </>
    );
}
