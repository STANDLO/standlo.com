"use client";

import { useEffect, useState } from "react";
import { useCanvasStore } from "./store";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import canvasMaterials from "@/core/constants/canvas_materials.json";
import { v4 as uuidv4 } from "uuid";

interface CatalogItem {
    id: string;
    name: string;
    useCases?: { canvasType: string; canvasLayer: string }[];
    dimensions?: number[];
    geometryType?: string;
    materialId?: string;
    textureId?: string;
    meshId?: string;
}

export function CanvasCatalogSidebar({ entityId, entityType }: { entityId?: string, entityType?: string | null }) {
    const mode = useCanvasStore((state) => state.mode);
    const setMode = useCanvasStore((state) => state.setMode);
    const addEntity = useCanvasStore((state) => state.addEntity);
    const getNextOrder = useCanvasStore((state) => state.getNextOrder);
    
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!mode) return;

        let isMounted = true;
        setLoading(true);

        const fetchItems = async () => {
            try {
                const { auth } = await import("@/core/firebase");

                // Wait for Firebase Auth to initialize from local storage
                await auth.authStateReady();

                const currentUser = auth.currentUser;
                const idToken = currentUser ? await currentUser.getIdToken() : undefined;

                if (!idToken) {
                    console.warn("No auth token available, listing might fail if endpoint requires auth.");
                }

                const reqBody = {
                    actionId: "list",
                    entityId: mode, // 'part', 'assembly', 'stand'
                    payload: {
                        filters: search ? [
                            { field: "name", op: ">=", value: search },
                            { field: "name", op: "<=", value: search + "\uf8ff" }
                        ] : [],
                        limit: 50
                    }
                };

                const { callGateway } = await import("@/lib/api");

                let actualList: CatalogItem[] = [];
                try {
                    const dataList = await callGateway("orchestrator", reqBody);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    actualList = (dataList as any).data as CatalogItem[] || dataList as CatalogItem[] || [];
                } catch (err) {
                    console.warn(`[CanvasCatalogSidebar] Fetch failed, falling back to mock...`, err);
                    if (isMounted) {
                        setItems([
                            { id: "mock-1", name: "Struttura Base", useCases: [{ canvasType: entityType || "stand", canvasLayer: "strutture" }], dimensions: [1, 2, 1], geometryType: "box" },
                            { id: "mock-2", name: "Tavolo Standard", useCases: [{ canvasType: entityType || "stand", canvasLayer: "arredo" }], dimensions: [2, 0.8, 1], geometryType: "box" },
                            { id: "mock-3", name: "Pannello Grafico", useCases: [{ canvasType: entityType || "stand", canvasLayer: "grafiche" }], dimensions: [1, 2, 0.1], geometryType: "box" }
                        ]);
                    }
                    return;
                }

                // Static materials map from codebase JSON
                const materialsMap = new Map();
                if (Array.isArray(canvasMaterials)) {
                    canvasMaterials.forEach(m => materialsMap.set(m.id, m));
                }

                if (isMounted && Array.isArray(actualList)) {
                    // Resolve missing meshes for parts
                    const meshIdsToFetch = Array.from(new Set(
                        actualList.filter((i: CatalogItem & { meshId?: string; dimensions?: unknown }) => i.meshId && !i.dimensions).map((i: CatalogItem & { meshId?: string }) => i.meshId)
                    ));
                    const meshCache = new Map();

                    if (meshIdsToFetch.length > 0) {
                        await Promise.all(meshIdsToFetch.map(async (mId) => {
                            try {
                                const meshData = await callGateway("orchestrator", {
                                    actionId: "read",
                                    entityId: "mesh",
                                    payload: { id: mId }
                                });
                                if (meshData) meshCache.set(mId, meshData);
                            } catch (e) {
                                console.warn("Failed fetching mesh", mId, e);
                            }
                        }));
                    }

                    // Augment with mesh and material properties
                    const augmentedList = actualList.map(item => {
                        const finalItem = { ...item };
                        
                        if (finalItem.meshId && meshCache.has(finalItem.meshId)) {
                            const meshDef = meshCache.get(finalItem.meshId);
                            // Merge inherited attributes if not explicitly overridden
                            finalItem.dimensions = finalItem.dimensions || meshDef.dimensions;
                            finalItem.geometryType = finalItem.geometryType || meshDef.geometryType || meshDef.geometry;
                            finalItem.materialId = finalItem.materialId || meshDef.materialId;
                            finalItem.textureId = finalItem.textureId || meshDef.textureId;
                        }

                        if (finalItem.materialId && materialsMap.has(finalItem.materialId)) {
                            const mat = materialsMap.get(finalItem.materialId);
                            return { ...finalItem, color: mat.baseColor, roughness: mat.roughness, metalness: mat.metalness };
                        }
                        return finalItem;
                    });
                    setItems(augmentedList);
                }
            } catch (err) {
                console.error("Failed to fetch catalog items", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchItems, 300); // debounce search
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [mode, search, entityType]);

    if (!mode) return null;

    const handleInsert = async (item: CatalogItem & { color?: string; roughness?: number; metalness?: number }) => {
        const nodeId = uuidv4();
        
        // Determina il layer tramite auto-routing
        let layerId = "strutture"; // fallback
        const currentCanvasType = entityType || "stand";
        if (item.useCases && item.useCases.length > 0) {
            const match = item.useCases.find(u => u.canvasType === currentCanvasType);
            if (match && match.canvasLayer) {
                layerId = match.canvasLayer;
            } else if (item.useCases[0].canvasLayer) {
                layerId = item.useCases[0].canvasLayer;
            }
        }

        const newPos: [number, number, number] = [0, (item.dimensions?.[2] ?? item.dimensions?.[1] ?? 1) / 2, 0];

        // 1. Optimistic UI insertion
        const dims = item.dimensions || [1, 1, 1];
        addEntity({
            id: nodeId,
            baseEntityId: item.id,
            type: mode,
            position: newPos,
            rotation: [0, 0, 0, 1],
            sockets: [],
            order: getNextOrder(),
            layerId,
            metadata: {
                geometry: item.geometryType || "box",
                dimensions: dims,
                materialId: item.materialId,
                textureId: item.textureId,
                name: item.name,
                color: item.color,
                roughness: item.roughness,
                metalness: item.metalness
            }
        });

        // 2. Orchestrator fire & forget
        if (entityId) {
            try {
                const { callGateway } = await import("@/lib/api");
                
                callGateway("canvas", {
                    actionId: "insertNode",
                    payload: {
                        canvasId: entityId,
                        nodeId,
                        baseEntityId: item.id,
                        entityType: mode,
                        layerId,
                        position: newPos,
                        rotation: [0, 0, 0],
                        scale: dims,
                        metadata: {
                            geometry: item.geometryType || "box",
                            dimensions: dims,
                            materialId: item.materialId,
                            textureId: item.textureId,
                            name: item.name,
                            color: item.color,
                            roughness: item.roughness,
                            metalness: item.metalness
                        },
                        name: item.name
                    }
                }).catch(e => console.error("Async insertNode failed", e));
            } catch (err) {
                console.error("Failed to trigger orchestrator", err);
            }
        }
    };

    return (
        <div className="absolute top-[80px] left-4 bottom-4 w-72 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl z-20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h3 className="font-semibold capitalize text-sm">{mode} Catalog</h3>
                <button onClick={() => setMode(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="p-3 border-b border-border/50">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                        placeholder="Search catalog..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-9 text-xs"
                    />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
                {loading && <div className="col-span-2 text-center text-xs p-4 text-muted-foreground">Loading...</div>}
                {!loading && items.length === 0 && <div className="col-span-2 text-center text-xs p-4 text-muted-foreground">No items found</div>}
                
                {!loading && items.map(item => (
                    <div 
                        key={item.id} 
                        className="bg-background border border-border/50 rounded-lg p-3 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors group"
                        onClick={() => handleInsert(item)}
                        title="Click to insert"
                    >
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <span className="text-[10px] text-muted-foreground group-hover:text-primary">3D</span>
                        </div>
                        <span className="text-[10px] text-center font-medium leading-tight line-clamp-2">{item.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
