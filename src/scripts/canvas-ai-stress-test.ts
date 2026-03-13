
import { useCanvasStore } from "@/components/layout/canvas/store";
import { callGateway } from "@/lib/api";

/**
 * A standalone script representing an AI Skill or external logic 
 * interacting with the Canvas programmatic API.
 */
export const runInstancingStressTest = async (count: number = 500, radius: number = 50, syncDb: boolean = false, canvasId?: string) => {
    console.log(`[Canvas AI] Starting Stress Test Script: ${count} objects...`);
    
    const state = useCanvasStore.getState();
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
                baseEntityId = `MSH-${crypto.randomUUID().substring(0, 4).toUpperCase()}`;
                const geos = ["box", "sphere", "cylinder"];
                geometry = geos[Math.floor(Math.random() * geos.length)];
            } else if (type === "assembly") {
                baseEntityId = `ASS-${crypto.randomUUID().substring(0, 4).toUpperCase()}`;
            } else if (type === "bundle") {
                baseEntityId = `BUN-${crypto.randomUUID().substring(0, 4).toUpperCase()}`;
            } else if (type === "design") {
                baseEntityId = `STA-${crypto.randomUUID().substring(0, 4).toUpperCase()}`;
            }

            const id = `ai-stress-${crypto.randomUUID().substring(0, 8)}`;
            
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
