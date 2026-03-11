"use client";

import { useCanvasStore } from "@/components/layout/canvas/store";
import { useTranslations } from "next-intl";
import {
    Layers,
    Move3d,
    Rotate3d,
    Magnet,
    Share2,
    Component,
    House,
    Group,
    RectangleGoggles,
    Glasses,
    Axis3D,
    GanttChart,
    LayoutList,
    Play,
    Instagram,
    Linkedin,
    Copy,
    Trash2,
    Palette,
    X
} from "lucide-react";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import canvasMaterials from "@/core/constants/canvas_materials.json";
import canvasTextures from "@/core/constants/canvas_textures.json";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover";

export function CanvasTools() {
    const t = useTranslations("Canvas.tools");
    const mode = useCanvasStore((state) => state.mode);
    const setMode = useCanvasStore((state) => state.setMode);
    const transformMode = useCanvasStore((state) => state.transformMode);
    const setTransformMode = useCanvasStore((state) => state.setTransformMode);
    const editPassword = useCanvasStore((state) => state.editPassword);

    const selectedEntityId = useCanvasStore((state) => state.selectedEntityId);
    const entities = useCanvasStore((state) => state.entities);
    const removeEntity = useCanvasStore((state) => state.removeEntity);
    const addEntity = useCanvasStore((state) => state.addEntity);
    const updateEntityMetadata = useCanvasStore((state) => state.updateEntityMetadata);
    const getNextOrder = useCanvasStore((state) => state.getNextOrder);

    const params = useParams();
    const canvasId = params?.id as string;

    const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
    const adminUrl = editPassword ? `${currentUrl}?key=${editPassword}` : '';

    const executeMaterialApply = async (matId?: string, texId?: string | "clear") => {
        if (!selectedEntityId) return;
        const entity = entities[selectedEntityId];
        if (!entity || !entity.metadata) return;

        const newMeta = { ...entity.metadata };
        
        if (matId !== undefined) {
            newMeta.materialId = matId;
            const matObj = canvasMaterials.find(m => m.id === matId);
            if (matObj) {
                newMeta.color = matObj.baseColor;
                newMeta.roughness = matObj.roughness;
                newMeta.metalness = matObj.metalness;
            }
        }
        
        if (texId !== undefined) {
            newMeta.textureId = texId === "clear" ? null : texId;
            if (texId !== "clear") {
                const texObj = canvasTextures.find(t => t.id === texId) as Record<string, unknown> & { valueLight?: string };
                if (texObj) {
                    if (texObj.valueLight) newMeta.color = texObj.valueLight;
                }
            }
        }

        updateEntityMetadata(selectedEntityId, newMeta);

        if (canvasId) {
            try {
                const { callGateway } = await import("@/lib/api");
                
                const clamp = (v: number) => Number(v.toFixed(3));
                callGateway("canvas", {
                    actionId: "updateNode",
                    payload: {
                        canvasId,
                        nodeId: selectedEntityId,
                        position: entity.position.map(clamp) as [number, number, number],
                        rotation: entity.rotation.map(clamp) as [number, number, number, number] | [number, number, number],
                        scale: entity.metadata?.dimensions?.map(clamp) || [1, 1, 1],
                        metadata: newMeta
                    }
                }).catch(e => console.error("Async texture apply failed", e));
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <div className="ui-canvas-tools">
            {/* INSERIMENTO BLOCK */}
            <div className="ui-canvas-tools-block">
                <div className="ui-canvas-tools-title">{t("inserimento")}</div>
                <div className="ui-canvas-tools-group">
                    <button 
                        className="ui-canvas-tools-btn h-10 w-10 px-0" 
                        data-active={mode === "part"}
                        onClick={() => setMode("part")}
                        title={t("addPart")}
                    >
                        <Component className="ui-canvas-tools-icon" />
                    </button>
                    <button 
                        className="ui-canvas-tools-btn h-10 w-10 px-0" 
                        data-active={mode === "assembly"}
                        onClick={() => setMode("assembly")}
                        title={t("addAssembly")}
                    >
                        <Group className="ui-canvas-tools-icon" />
                    </button>
                    <button 
                        className="ui-canvas-tools-btn h-10 w-10 px-0" 
                        data-active={mode === "bundle"}
                        onClick={() => setMode("bundle")}
                        title={t("addBundle")}
                    >
                        <Layers className="ui-canvas-tools-icon" />
                    </button>
                    <button 
                        className="ui-canvas-tools-btn h-10 w-10 px-0" 
                        data-active={mode === "stand"}
                        onClick={() => setMode("stand")}
                        title={t("addStand")}
                    >
                        <House className="ui-canvas-tools-icon" />
                    </button>
                </div>
            </div>

            {/* AZIONI BLOCK */}
            <div className="ui-canvas-tools-block">
                <div className="ui-canvas-tools-title">{t("azioni")}</div>
                <div className="ui-canvas-tools-group">
                    <button
                        className="ui-canvas-tools-btn h-10 w-10"
                        data-active={transformMode === "translate"}
                        onClick={() => setTransformMode("translate")}
                        title={t("move")}
                    >
                        <Move3d className="ui-canvas-tools-icon" />
                    </button>
                    <button
                        className="ui-canvas-tools-btn h-10 w-10"
                        data-active={transformMode === "rotate"}
                        onClick={() => setTransformMode("rotate")}
                        title={t("rotate")}
                    >
                        <Rotate3d className="ui-canvas-tools-icon" />
                    </button>
                    <button
                        className="ui-canvas-tools-btn h-10 w-10"
                        data-active={transformMode === "snap"}
                        onClick={() => setTransformMode("snap")}
                        title={t("snap")}
                    >
                        <Magnet className="ui-canvas-tools-icon" />
                    </button>
                    {selectedEntityId && entities[selectedEntityId] && (
                        <>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        className="ui-canvas-tools-btn h-10 w-10"
                                        title={t("applyMaterial") || "Applicatore Texture/Materiale"}
                                    >
                                        <Palette className="ui-canvas-tools-icon" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent side="top" align="center" className="w-64 p-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-slate-200 dark:border-white/10 shadow-xl z-[9999]" onInteractOutside={() => {
                                    // Make sure touching outside doesn't auto-deselect entity if we are using the popover
                                }}>
                                    <div className="text-sm font-semibold mb-2">Materiali & Texture</div>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-1">Materiale Base</div>
                                            <div className="flex gap-1 flex-wrap">
                                                {canvasMaterials.map(m => (
                                                    <button 
                                                        key={m.id} 
                                                        className="w-6 h-6 rounded-full border border-black/10 dark:border-white/10 hover:scale-110 transition-transform"
                                                        style={{ backgroundColor: m.baseColor }}
                                                        title={m.name}
                                                        onClick={() => executeMaterialApply(m.id, undefined)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-muted-foreground mb-1">Applica Colore/Texture</div>
                                            <div className="flex gap-1 flex-wrap">
                                                 <button 
                                                    className="w-6 h-6 rounded border border-black/10 dark:border-white/10 hover:scale-110 transition-transform bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-[10px]"
                                                    title="Nessuna Texture"
                                                    onClick={() => executeMaterialApply(undefined, "clear")}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                                {canvasTextures.map((t: Record<string, unknown> & { id: string; name: string; valueLight?: string; valueDark?: string }) => (
                                                    <button 
                                                        key={t.id} 
                                                        className="w-6 h-6 rounded border border-black/10 dark:border-white/10 hover:scale-110 transition-transform"
                                                        style={{ backgroundColor: t.valueLight || t.valueDark || '#ccc' }}
                                                        title={t.name}
                                                        onClick={() => executeMaterialApply(undefined, t.id)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <button
                                className="ui-canvas-tools-btn h-10 w-10"
                                onClick={async () => {
                                    const sourceEntity = entities[selectedEntityId];
                                    if (!sourceEntity) return;
                                    
                                    const clamp = (v: number) => Number(v.toFixed(3));
                                    const newNodeId = uuidv4();
                                    const newPos: [number, number, number] = [
                                        clamp(sourceEntity.position[0] + 0.5),
                                        clamp(sourceEntity.position[1]),
                                        clamp(sourceEntity.position[2] + 0.5)
                                    ];
                                    
                                    const clonedEntity = {
                                        ...sourceEntity,
                                        id: newNodeId,
                                        position: newPos,
                                        order: getNextOrder()
                                    };
                                    
                                    addEntity(clonedEntity);
                                    
                                    if (canvasId) {
                                        try {
                                            const { callGateway } = await import("@/lib/api");
                                            callGateway("canvas", {
                                                actionId: "insertNode",
                                                payload: {
                                                    canvasId,
                                                    nodeId: newNodeId,
                                                    baseEntityId: clonedEntity.baseEntityId,
                                                    entityType: clonedEntity.type,
                                                    layerId: clonedEntity.layerId,
                                                    position: newPos,
                                                    rotation: clonedEntity.rotation.map(clamp) as [number, number, number, number] | [number, number, number],
                                                    scale: clonedEntity.metadata?.dimensions?.map(clamp) || [1, 1, 1],
                                                    metadata: clonedEntity.metadata,
                                                    name: `${clonedEntity.metadata?.name || 'Copia'} (Copia)`
                                                }
                                            }).catch(e => console.error("Async insertNode failed", e));
                                        } catch(e) { console.error(e); }
                                    }
                                }}
                                title={t("duplicate", { fallback: "Duplica" })}
                            >
                                <Copy className="ui-canvas-tools-icon" />
                            </button>
                            <button
                                className="ui-canvas-tools-btn h-10 w-10 text-destructive hover:text-destructive"
                                onClick={async () => {
                                    const activeId = selectedEntityId;
                                    removeEntity(activeId);
                                    if (canvasId) {
                                        try {
                                            const { callGateway } = await import("@/lib/api");
                                            callGateway("canvas", {
                                                actionId: "deleteNode",
                                                payload: { canvasId, nodeId: activeId }
                                            }).catch(e => console.error("Async deleteNode failed", e));
                                        } catch(e) { console.error(e); }
                                    }
                                }}
                                title={t("delete", { fallback: "Elimina" })}
                            >
                                <Trash2 className="ui-canvas-tools-icon" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* VIEW BLOCK (AR/VR) */}
            <div className="ui-canvas-tools-block">
                <div className="ui-canvas-tools-title">{t("view")}</div>
                <div className="ui-canvas-tools-group">
                    <button className="ui-canvas-tools-btn h-10 w-10 px-0" data-active={true} title={t("view3d")}>
                        <Axis3D className="ui-canvas-tools-icon" />
                    </button>
                    {/* Placeholder for WebXR triggers, ready for Meta Quest 3 testing later */}
                    <button className="ui-canvas-tools-btn h-10 w-10 px-0" title={t("viewAr")}>
                        <Glasses className="ui-canvas-tools-icon" />
                    </button>
                    <button className="ui-canvas-tools-btn h-10 w-10 px-0" title={t("viewVr")}>
                        <RectangleGoggles className="ui-canvas-tools-icon" />
                    </button>
                </div>
            </div>

            {/* MANUFACTURING BLOCK */}
            <div className="ui-canvas-tools-block">
                <div className="ui-canvas-tools-title">{t("manufacturing")}</div>
                <div className="ui-canvas-tools-group">
                    <button className="ui-canvas-tools-btn h-10 w-10 px-0" title={t("bom")}>
                        <LayoutList className="ui-canvas-tools-icon" />
                    </button>
                    <button className="ui-canvas-tools-btn h-10 w-10 px-0" title={t("bop")}>
                        <GanttChart className="ui-canvas-tools-icon" />
                    </button>
                    <button className="ui-canvas-tools-btn h-10 w-10 px-0" title={t("play")}>
                        <Play className="ui-canvas-tools-icon" />
                    </button>
                </div>
            </div>

            {/* SHARE BLOCK */}
            <div className="ui-canvas-tools-block">
                <div className="ui-canvas-tools-title">{t("share")}</div>
                <div className="ui-canvas-tools-group">
                    <button 
                        className="ui-canvas-tools-btn h-10 w-10 px-0" 
                        title="Instagram"
                        onClick={() => {
                            const text = `STANDLO | The Global Factory\n${currentUrl}`;
                            navigator.clipboard.writeText(text).then(() => {
                                window.open('https://www.instagram.com/', '_blank');
                            }).catch(() => {
                                window.open('https://www.instagram.com/', '_blank');
                            });
                        }}
                    >
                        <Instagram className="ui-canvas-tools-icon" />
                    </button>
                    <button 
                        className="ui-canvas-tools-btn h-10 w-10 px-0" 
                        title="LinkedIn"
                        onClick={() => {
                            const text = `STANDLO | The Global Factory\n${currentUrl}`;
                            window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`, '_blank');
                        }}
                    >
                        <Linkedin className="ui-canvas-tools-icon" />
                    </button>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="ui-canvas-tools-btn h-10 w-10 px-0" title={t("share")}>
                                <Share2 className="ui-canvas-tools-icon" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-80 p-4 space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">{t("shareDialogTitle")}</h4>
                                <p className="text-xs text-muted-foreground">{t("shareDialogDesc")}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <code className="flex-1 bg-muted p-2 rounded text-xs truncate select-all">
                                        {currentUrl}
                                    </code>
                                </div>
                            </div>

                            {editPassword && (
                                <div className="space-y-2 pt-3 border-t">
                                    <h4 className="font-medium text-sm text-amber-600 dark:text-amber-500">{t("adminCredentials")}</h4>
                                    <p className="text-xs text-muted-foreground">{t("adminDesc")}</p>
                                    <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 mt-2 text-xs">
                                        <span className="font-semibold text-right">{t("urlLabel")}</span>
                                        <code className="bg-muted p-1 rounded truncate select-all">{adminUrl}</code>
                                        <span className="font-semibold text-right">{t("passwordLabel")}</span>
                                        <code className="bg-muted p-1 rounded font-mono select-all font-bold text-amber-600">{editPassword}</code>
                                    </div>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </div>
    );
}
