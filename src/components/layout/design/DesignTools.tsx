"use client";

import { useDesignStore } from "@/lib/zustand";
import { useTranslations } from "next-intl";
import { xrStore } from "./xrStore";
import { DesignTools as PDMTools } from "../../../../functions/src/core/constants";

import {
    Box,
    Boxes,
    Package,
    Building2,
    Layers,
    Move3d,
    Rotate3d,
    Magnet,
    Share2,
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
    X,
    View,
    ScanEye,
    SwitchCamera,
    Headset,
    LogOut,
    LogIn
} from "lucide-react";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover";
import { useState, useEffect } from "react";
import { ErrorGuard } from "@/components/ui/ErrorGuard";
import { DesignDebug } from "./DesignDebug";
import { SwitchLocale } from "@/components/ui/SwitchLocale";
import { SwitchTheme } from "@/components/ui/SwitchTheme";
import { Link } from "@/i18n/routing";
import type { User as FirebaseUser } from "firebase/auth";
import { useLocale } from "next-intl";

export function DesignTools() {
    const t = useTranslations("Canvas.tools");
    const isProd = process.env.NODE_ENV === "production";
    const mode = useDesignStore((state) => state.mode);
    const setMode = useDesignStore((state) => state.setMode);
    const transformMode = useDesignStore((state) => state.transformMode);
    const setTransformMode = useDesignStore((state) => state.setTransformMode);
    const cameraMode = useDesignStore((state) => state.cameraMode);
    const setCameraMode = useDesignStore((state) => state.setCameraMode);
    const triggerCameraReset = useDesignStore((state) => state.triggerCameraReset);
    const editPassword = useDesignStore((state) => state.editPassword);
    const canvasMaterials = useDesignStore((state) => state.materialsRegistry);
    const canvasTextures = useDesignStore((state) => state.texturesRegistry);

    const selectedEntityId = useDesignStore((state) => state.selectedEntityId);
    const entities = useDesignStore((state) => state.entities);
    const selectedEntity = selectedEntityId ? entities[selectedEntityId] : null;
    const currentMaterialId = selectedEntity?.metadata?.materialId as string | undefined;

    const typedCanvasTextures = canvasTextures as (Record<string, unknown> & { id: string, name?: string, compatibleMaterials?: string[], valueLight?: string, valueDark?: string })[];
    const typedCanvasMaterials = canvasMaterials as (Record<string, unknown> & { id: string, name?: string, baseColor?: string })[];
    const filteredTextures = currentMaterialId
        ? typedCanvasTextures.filter(t => !t.compatibleMaterials || t.compatibleMaterials.length === 0 || t.compatibleMaterials.includes(currentMaterialId))
        : typedCanvasTextures;
    const removeEntity = useDesignStore((state) => state.removeEntity);
    const addEntity = useDesignStore((state) => state.addEntity);
    const updateEntityMetadata = useDesignStore((state) => state.updateEntityMetadata);
    const getNextOrder = useDesignStore((state) => state.getNextOrder);

    const params = useParams();
    const canvasId = params?.id as string;

    const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
    const adminUrl = editPassword ? `${currentUrl}?key=${editPassword}` : '';

    const [xrError, setXrError] = useState<Error | null>(null);
    const [user, setUser] = useState<FirebaseUser | null | undefined>(undefined);
    const locale = useLocale();

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        import("@/core/firebase").then(({ auth }) => {
            unsubscribe = auth.onAuthStateChanged((u) => {
                setUser(u);
            });
        });
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    const executeMaterialApply = async (matId?: string, texId?: string | "clear") => {
        if (!selectedEntityId) return;
        const entity = entities[selectedEntityId];
        if (!entity || !entity.metadata) return;

        const newMeta = { ...entity.metadata };

        if (matId !== undefined) {
            newMeta.materialId = matId;
            const matObj = canvasMaterials.find(m => m.id === matId) as Record<string, unknown> & {
                baseColor: string;
                roughness: number;
                metalness: number;
                clearcoat?: number;
                clearcoatRoughness?: number;
                sheen?: number;
                sheenRoughness?: number;
                transmission?: number;
                ior?: number;
                repeatX?: number;
                repeatY?: number;
            } | undefined;
            if (matObj) {
                newMeta.color = matObj.baseColor;
                newMeta.roughness = matObj.roughness;
                newMeta.metalness = matObj.metalness;

                // Advanced PBR Properties
                if (matObj.clearcoat !== undefined) newMeta.clearcoat = matObj.clearcoat;
                if (matObj.clearcoatRoughness !== undefined) newMeta.clearcoatRoughness = matObj.clearcoatRoughness;
                if (matObj.sheen !== undefined) newMeta.sheen = matObj.sheen;
                if (matObj.sheenRoughness !== undefined) newMeta.sheenRoughness = matObj.sheenRoughness;
                if (matObj.transmission !== undefined) newMeta.transmission = matObj.transmission;
                if (matObj.ior !== undefined) newMeta.ior = matObj.ior;
                if (matObj.repeatX !== undefined) newMeta.repeatX = matObj.repeatX;
                if (matObj.repeatY !== undefined) newMeta.repeatY = matObj.repeatY;
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
                callGateway("orchestrator", {
                    actionId: "updateNode",
                    payload: {
                        canvasId,
                        nodeId: selectedEntityId,
                        position: entity.position.map(clamp) as [number, number, number],
                        rotation: entity.rotation.map(clamp) as [number, number, number, number] | [number, number, number],
                        metadata: newMeta
                    }
                }).catch(e => console.error("Async texture apply failed", e));
            } catch (e) {
                console.error(e);
            }
        }
    };

    return (
        <div className="ui-design-tools">
            {/* DYNAMIC GROUPS */}
            {Object.entries(
                Object.values(PDMTools).reduce((acc, tool) => {
                    if (!tool.active) return acc;
                    if (!acc[tool.group]) acc[tool.group] = [];
                    acc[tool.group].push(tool);
                    return acc;
                }, {} as Record<string, typeof PDMTools[keyof typeof PDMTools][]>)
            ).map(([groupName, mapTools]) => (
                <div key={groupName} className="ui-design-tools-block">
                    <div className="ui-design-tools-title">{t(groupName, { fallback: groupName.toUpperCase() })}</div>
                    <div className="ui-design-tools-group">
                        {mapTools.map((tool) => {
                            let IconComponent = Layers;
                            switch (tool.icon as string) {
                                case "Box": IconComponent = Box as typeof Layers; break;
                                case "Boxes": IconComponent = Boxes as typeof Layers; break;
                                case "Layers": IconComponent = Layers as typeof Layers; break;
                                case "Package": IconComponent = Package as typeof Layers; break;
                                case "Building2": IconComponent = Building2 as typeof Layers; break;
                            }
                            
                            return (
                                <button
                                    key={tool.id}
                                    className="ui-design-tools-btn h-10 w-10 px-0"
                                    data-active={mode === tool.id}
                                    data-group={tool.group}
                                    onClick={() => setMode(tool.id as "sketch" | "part" | "assembly" | "bundle" | "design" | null)}
                                    title={t(tool.name.split('.').pop() || tool.id)}
                                >
                                    <IconComponent className="ui-design-tools-icon " />
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {/* AZIONI BLOCK */}
            <div className="ui-design-tools-block">
                <div className="ui-design-tools-title">{t("azioni")}</div>
                <div className="ui-design-tools-group">
                    <button
                        className="ui-design-tools-btn h-10 w-10"
                        data-active={transformMode === "translate"}
                        onClick={() => setTransformMode("translate")}
                        title={t("move")}
                    >
                        <Move3d className="ui-design-tools-icon" />
                    </button>
                    <button
                        className="ui-design-tools-btn h-10 w-10"
                        data-active={transformMode === "rotate"}
                        onClick={() => setTransformMode("rotate")}
                        title={t("rotate")}
                    >
                        <Rotate3d className="ui-design-tools-icon" />
                    </button>
                    <button
                        className="ui-design-tools-btn h-10 w-10"
                        data-active={transformMode === "snap"}
                        onClick={() => setTransformMode("snap")}
                        title={t("snap")}
                    >
                        <Magnet className="ui-design-tools-icon" />
                    </button>
                    {selectedEntityId && entities[selectedEntityId] && (
                        <>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        className="ui-design-tools-btn h-10 w-10"
                                        title={t("applyMaterial") || "Applicatore Texture/Materiale"}
                                    >
                                        <Palette className="ui-design-tools-icon" />
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
                                                {typedCanvasMaterials.map((m) => (
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
                                                {filteredTextures.map((t) => (
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
                                className="ui-design-tools-btn h-10 w-10"
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
                                            callGateway("orchestrator", {
                                                actionId: "createNode",
                                                payload: {
                                                    canvasId,
                                                    nodeId: newNodeId,
                                                    baseEntityId: clonedEntity.baseEntityId,
                                                    entityType: clonedEntity.type,
                                                    layerId: clonedEntity.layerId,
                                                    position: newPos,
                                                    rotation: clonedEntity.rotation.map(clamp) as [number, number, number, number] | [number, number, number],
                                                    metadata: clonedEntity.metadata,
                                                    name: `${clonedEntity.metadata?.name || 'Copia'} (Copia)`
                                                }
                                            }).catch(e => console.error("Async createNode failed", e));
                                        } catch (e) { console.error(e); }
                                    }
                                }}
                                title={t("duplicate", { fallback: "Duplica" })}
                            >
                                <Copy className="ui-design-tools-icon" />
                            </button>
                            <button
                                className="ui-design-tools-btn h-10 w-10 text-destructive hover:text-destructive"
                                onClick={async () => {
                                    const activeId = selectedEntityId;
                                    removeEntity(activeId);
                                    if (canvasId) {
                                        try {
                                            const { callGateway } = await import("@/lib/api");
                                            callGateway("orchestrator", {
                                                actionId: "deleteNode",
                                                payload: { canvasId, nodeId: activeId }
                                            }).catch(e => console.error("Async deleteNode failed", e));
                                        } catch (e) { console.error(e); }
                                    }
                                }}
                                title={t("delete", { fallback: "Elimina" })}
                            >
                                <Trash2 className="ui-design-tools-icon" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* PROIEZIONI BLOCK */}
            <div className="ui-design-tools-block hidden">
                <div className="ui-design-tools-title">{t("projections")}</div>
                <div className="ui-design-tools-group">
                    <button
                        className="ui-design-tools-btn h-10 w-10 px-0"
                        data-active={cameraMode === "perspective"}
                        onClick={() => setCameraMode("perspective")}
                        title={t("perspective")}
                    >
                        <View className="ui-design-tools-icon" />
                    </button>
                    <button
                        className="ui-design-tools-btn h-10 w-10 px-0"
                        data-active={cameraMode === "orthographic"}
                        onClick={() => setCameraMode("orthographic")}
                        title={t("orthographic")}
                    >
                        <ScanEye className="ui-design-tools-icon" />
                    </button>
                    <button
                        className="ui-design-tools-btn h-10 w-10 px-0"
                        data-active={cameraMode === "ortho_faces"}
                        onClick={() => setCameraMode("ortho_faces")}
                        title={t("ortho_faces")}
                    >
                        <Glasses className="ui-design-tools-icon" />
                    </button>
                    <button
                        className="ui-design-tools-btn h-10 w-10 px-0"
                        onClick={() => triggerCameraReset()}
                        title={"Home"}
                    >
                        <SwitchCamera className="ui-design-tools-icon" />
                    </button>
                </div>
            </div>

            {/* VIEW BLOCK (AR/VR) */}
            <div className="ui-design-tools-block">
                <div className="ui-design-tools-title">{t("view")}</div>
                <div className="ui-design-tools-group">
                    <button className="ui-design-tools-btn h-10 w-10 px-0" data-active={true} title={t("view3d")}>
                        <Axis3D className="ui-design-tools-icon" />
                    </button>
                    <button
                        className="ui-design-tools-btn h-10 w-10 px-0"
                        title="WebXR"
                        onClick={() => {
                            // Si usa enterVR() come base immersiva per il Quest 3
                            xrStore.enterVR().catch((e: Error) => {
                                console.warn("XR non supportato:", e);
                                setXrError(e);
                            });
                        }}
                    >
                        <RectangleGoggles className="ui-design-tools-icon" />
                    </button>
                </div>
            </div>

            {/* MANUFACTURING BLOCK */}
            <div className="ui-design-tools-block">
                <div className="ui-design-tools-title">{t("manufacturing")}</div>
                <div className="ui-design-tools-group">
                    <button className="ui-design-tools-btn h-10 w-10 px-0" title={t("bom")}>
                        <LayoutList className="ui-design-tools-icon" />
                    </button>
                    <button className="ui-design-tools-btn h-10 w-10 px-0" title={t("bop")}>
                        <GanttChart className="ui-design-tools-icon" />
                    </button>
                    {!isProd && (
                        <button className="ui-design-tools-btn h-10 w-10 px-0 hidden" title={t("play")}>
                            <Play className="ui-design-tools-icon" />
                        </button>
                    )}
                </div>
            </div>

            {/* SHARE BLOCK */}
            <div className="ui-design-tools-block">
                <div className="ui-design-tools-title">{t("share")}</div>
                <div className="ui-design-tools-group">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="ui-design-tools-btn h-10 w-10 px-0" title={t("share")}>
                                <Share2 className="ui-design-tools-icon" />
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
                    <button
                        className="ui-design-tools-btn h-10 w-10 px-0"
                        title="LinkedIn"
                        onClick={() => {
                            const text = `STANDLO | The Global Factory\n${currentUrl}`;
                            window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`, '_blank');
                        }}
                    >
                        <Linkedin className="ui-design-tools-icon" />
                    </button>
                    <button
                        className="ui-design-tools-btn h-10 w-10 px-0"
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
                        <Instagram className="ui-design-tools-icon" />
                    </button>
                </div>
            </div>

            {/* ACCOUNT BLOCK */}
            <div className="ui-design-tools-block">
                <div className="ui-design-tools-title">{t("account", { fallback: "Account" })}</div>
                <div className="ui-design-tools-group">
                    <DesignDebug />
                    <Link href="/partner/support" className="ui-design-tools-btn h-10 w-10 px-0 flex items-center justify-center" title={t("support", { fallback: "Support" })}>
                        <Headset className="ui-design-tools-icon" />
                    </Link>
                    <SwitchLocale />
                    <SwitchTheme />

                    <button
                        className="ui-design-tools-btn h-10 w-10 px-0"
                        title={user ? t("logout", { fallback: "Esci" }) : t("login", { fallback: "Accedi" })}
                        onClick={async () => {
                            if (user) {
                                try {
                                    const { auth } = await import("@/core/firebase");
                                    const token = await auth.currentUser?.getIdToken().catch(() => null);
                                    if (token) {
                                        const sessionId = localStorage.getItem("standlo_session");
                                        if (sessionId) {
                                            const { callGateway } = await import("@/lib/api");
                                            await callGateway("orchestrator", {
                                                actionId: "auth_event",
                                                payload: { type: "logout", sessionId }
                                            }).catch((e: Error) => console.error("Failed to log auth event (logout):", e));
                                        }
                                        localStorage.removeItem("standlo_session");
                                    }

                                    await auth.signOut();
                                    await fetch("/api/auth/logout", { method: "GET" });
                                    window.location.href = `/${locale}`;
                                } catch (error) {
                                    console.error("Logout failed", error);
                                }
                            } else {
                                window.location.href = `/${locale}/auth/login`;
                            }
                        }}
                    >
                        {user ? <LogOut className="ui-design-tools-icon" /> : <LogIn className="ui-design-tools-icon" />}
                    </button>
                </div>
            </div>

            {xrError && (
                <div className="fixed inset-0 z-[9999] bg-background">
                    <ErrorGuard error={xrError} onBack={() => setXrError(null)} />
                </div>
            )}
        </div>
    );
}
