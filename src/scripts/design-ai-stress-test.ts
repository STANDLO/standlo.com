
import { useDesignStore } from "@/lib/zustand";
import { callGateway } from "@/lib/api";
import { v4 as uuidv4 } from "uuid";

/**
 * A standalone script representing an AI Skill or external logic 
 * interacting with the Canvas programmatic API.
 */
export const runInstancingStressTest = async (count: number = 500, radius: number = 50, syncDb: boolean = false, canvasId?: string) => {
    console.log(`[Canvas AI] Starting Stress Test Script: ${count} objects...`);
    
    const state = useDesignStore.getState();
    // Filter out glass materials and white/bright textures for testing visibility
    const materials = (state.materialsRegistry || []).filter((m: Record<string, unknown>) => typeof m.transmission === "number" ? !(m.transmission > 0) : true);
    const textures = (state.texturesRegistry || []).filter((t: Record<string, unknown>) => t.valueLight !== '#ffffff' && t.valueLight !== '#f4f4f4');
    
    // Process items in chunks so we don't completely lock the main thread for massive counts
    const chunkSize = 100;
    
    // We'll calculate total required generated entities based on a hierarchy ratio
    for (let i = 0; i < count; i += chunkSize) {
        const currentChunkSize = Math.min(chunkSize, count - i);
        const newEntities: Record<string, unknown>[] = [];

        // Distribute chunk into hierarchy levels
        // E.g., 1 Stand -> 2 Bundles -> 4 Assemblies -> 10 Parts -> 20 Meshes
        for(let j = 0; j < currentChunkSize; j++) {
            const types: ("design" | "bundle" | "assembly" | "part" | "mesh")[] = ["mesh", "mesh", "mesh", "part", "part", "assembly", "bundle", "design"];
            const type = types[Math.floor(Math.random() * types.length)];
            
            // Generate basic positional logic
            const posX = (Math.random() * radius * 2) - radius;
            const posY = (Math.random() * radius * 2) - radius;
            const posZ = (Math.random() * radius * 2) - radius;
            
            // Random dimensions (0.5 to 5.0)
            const dimX = 0.5 + (Math.random() * 4.5);
            const dimY = 0.5 + (Math.random() * 4.5);
            const dimZ = 0.5 + (Math.random() * 4.5);
            
            // Random Material & Texture (Only for parts/meshes)
            const randomMaterial = (type === "part" || type === "mesh") && materials.length > 0 ? materials[Math.floor(Math.random() * materials.length)].id : undefined;
            const randomTexture = (type === "part" || type === "mesh") && textures.length > 0 ? textures[Math.floor(Math.random() * textures.length)].id : undefined;
            
            let baseEntityId = "";
            let geometry: string | undefined = undefined;
            const isBox = Math.random() > 0.5;

            if (type === "part") {
                baseEntityId = isBox ? "parametric_box" : "parametric_cylinder";
            } else if (type === "mesh") {
                baseEntityId = `MSH-${uuidv4().substring(0, 4).toUpperCase()}`;
                const geos = ["box", "sphere", "cylinder"];
                geometry = geos[Math.floor(Math.random() * geos.length)];
            } else if (type === "assembly") {
                baseEntityId = `ASS-${uuidv4().substring(0, 4).toUpperCase()}`;
            } else if (type === "bundle") {
                baseEntityId = `BUN-${uuidv4().substring(0, 4).toUpperCase()}`;
            } else if (type === "design") {
                baseEntityId = `STA-${uuidv4().substring(0, 4).toUpperCase()}`;
            }

            const id = `ai-stress-${uuidv4().substring(0, 8)}`;
            
            let argsToPass = [dimX, dimY, dimZ];
            if (geometry === "sphere") argsToPass = [dimX / 2, 32, 32];
            if (geometry === "cylinder") argsToPass = [dimX / 2, dimX / 2, dimY, 32];
            
            // Mock hierarchy assignment
            // In a real scenario, parentId would link these, but for stress testing the flat list 
            // with generic types proves rendering logic
            
            const newEntity = {
              id,
              baseEntityId,
              type,
              parentId: null, // Note: For a true tree we would link these
              layerId: "default",
              position: [posX, Math.max(0, posY), posZ] as [number, number, number], // Keep above ground roughly
              rotation: [0, 0, 0, 1] as [number, number, number, number], // Avoid crazy rotations for containers to look clean
              order: state.getNextOrder() || 0,
              sockets: [],
              metadata: {
                name: `AI Gen ${type} ${id.substring(0,4)}`,
                dimensions: [dimX, Math.max(1, dimY), dimZ],
                args: argsToPass,
                geometry: geometry, 
                geometryType: geometry || (isBox ? "box" : "cylinder"),
                materialId: randomMaterial,
                textureId: randomTexture
              }
            };

            state.addEntity(newEntity);
            newEntities.push(newEntity);
        }
        
        // If syncDb is true, blast this chunk to the Orchestrator
        if (syncDb && canvasId) {
            const promises = newEntities.map(async (entity) => {
                return callGateway("orchestrator", {
                    actionId: "createNode",
                    payload: {
                        canvasId,
                        baseEntityId: entity.baseEntityId,
                        type: entity.type,
                        parentId: entity.parentId,
                        layerId: entity.layerId,
                        position: entity.position,
                        rotation: entity.rotation,
                        metadata: entity.metadata
                    }
                }).catch(e => console.error("Stress Test Insert Error:", e));
            });
            
            await Promise.all(promises);
        }

        // Yield to main thread briefly
        await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    console.log(`[Canvas AI] Stress Test generation complete!`);
};

/**
 * Automates testing of spatial actions like Move and Rotate to verify 
 * performance and collision handling under rapid successive updates.
 */
export const runSpatialQATest = async (loops: number = 50, delayMs: number = 50) => {
    console.log(`[Canvas AI] Starting Spatial QA Sequence: ${loops} loops...`);
    const state = useDesignStore.getState();
    const entityIds = Object.keys(state.entities);
    
    if (entityIds.length === 0) {
        console.warn("[Canvas AI] Cannot run QA Sequence: No entities on canvas.");
        return;
    }

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    for (let i = 0; i < loops; i++) {
        // Randomly pick an entity
        const randId = entityIds[Math.floor(Math.random() * entityIds.length)];
        const entity = state.entities[randId];
        
        if (!entity) continue;

        // Select it
        state.selectEntity(randId);
        await delay(delayMs);

        // Move it slightly
        const moveAction = Math.random();
        if (moveAction > 0.5) {
            const dx = (Math.random() - 0.5) * 2;
            const dz = (Math.random() - 0.5) * 2;
            const newPos: [number, number, number] = [
                entity.position[0] + dx,
                entity.position[1],
                entity.position[2] + dz
            ];
            state.updateEntityPosition(randId, newPos);
        } else {
            // Rotate it
            const newQ: [number, number, number, number] = [0, Math.sin(Math.random() * Math.PI), 0, Math.cos(Math.random() * Math.PI)];
            state.updateEntityRotation(randId, newQ);
        }

        await delay(delayMs);
        
        // Randomly deselect
        if (Math.random() > 0.7) {
            state.selectEntity(null);
            await delay(delayMs);
        }
    }

    // Final cleanup
    state.selectEntity(null);
    console.log(`[Canvas AI] Spatial QA Sequence complete!`);
};
