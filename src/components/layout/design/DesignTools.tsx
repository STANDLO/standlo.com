"use client";

import { useDesignStore } from "@/lib/zustand";
import { useTranslations } from "next-intl";
import { DesignTools as PDMTools } from "../../../../functions/src/core/constants";
import { DesignController } from "@/lib/design";

import {
    Box, Boxes, Package, Building2, Layers, Move3d, Rotate3d, Magnet, Share2, RectangleGoggles,
    Axis3D, GanttChart, LayoutList, Instagram, Linkedin, Copy, Trash2, Palette,
    X, ScanEye, Headset, LogIn, MessageSquare, Globe, Sun, User,
    Link2, BoxSelect
} from "lucide-react";
import { useParams } from "next/navigation";

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
    const t = useTranslations("Design.tools");
    const mode = useDesignStore((state) => state.mode);
    const transformMode = useDesignStore((state) => state.transformMode);
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
    
    const updateEntityMetadata = useDesignStore((state) => state.updateEntityMetadata);

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


    const handleDesignToolLogout = async () => {
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
                if (typeof window !== "undefined") window.location.href = `/${locale}`;
            } catch (error) {
                console.error("Logout failed", error);
            }
        } else {
            if (typeof window !== "undefined") window.location.href = `/${locale}/auth/login`;
        }
    };

    const handleToolClick = (toolId: string) => {
        DesignController.executeToolCommand(toolId, canvasId);
    };

    // Prepare groups Based on new constant definitions
    const orderedTools = Object.values(PDMTools)
        .filter(t => t.active)
        .filter(t => user ? true : t.guest)
        .filter(t => {
            // Edit tools only visible when something is selected
            if (t.group === "edit" && !selectedEntityId) return false;
            // hide view 2d temporarily
            if (t.id === "view_2d") return false;
            return true;
        })
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    const groupedTools: Record<string, typeof orderedTools> = {};
    for (const t of orderedTools) {
        if (!groupedTools[t.group]) groupedTools[t.group] = [];
        groupedTools[t.group].push(t);
    }
    
    // We no longer need groupTranslates as the keys 'add', 'edit', 'mrp', 'view', 'share', 'general' are directly defined in the translation files.

    const renderIcon = (iconName: string) => {
        const props = { className: "ui-design-tools-icon" };
        switch (iconName) {
            case "BoxSelect": return <BoxSelect {...props} />;
            case "Box": return <Box {...props} />;
            case "Boxes": return <Boxes {...props} />;
            case "Layers": return <Layers {...props} />;
            case "Package": return <Package {...props} />;
            case "Building2": return <Building2 {...props} />;
            case "Move3d": return <Move3d {...props} />;
            case "Rotate3d": return <Rotate3d {...props} />;
            case "Magnet": return <Magnet {...props} />;
            case "Palette": return <Palette {...props} />;
            case "Copy": return <Copy {...props} />;
            case "Trash2": return <Trash2 {...props} />;
            case "LayoutList": return <LayoutList {...props} />;
            case "GanttChart": return <GanttChart {...props} />;
            case "ScanEye": return <ScanEye {...props} />;
            case "Axis3D": return <Axis3D {...props} />;
            case "RectangleGoggles": return <RectangleGoggles {...props} />;
            case "Share2": return <Share2 {...props} />;
            case "Link2": return <Link2 {...props} />;
            case "Linkedin": return <Linkedin {...props} />;
            case "Instagram": return <Instagram {...props} />;
            case "MessageSquare": return <MessageSquare {...props} />;
            case "LayoutDashboard": return <Building2 {...props} />; // Placeholder
            case "Globe": return <Globe {...props} />;
            case "Sun": return <Sun {...props} />;
            case "Headset": return <Headset {...props} />;
            case "User": return user ? <User {...props} /> : <LogIn {...props} />;
            default: return <Layers {...props} />;
        }
    };

    const checkActive = (toolId: string) => {
        if (mode === toolId) return true;
        if (transformMode === "translate" && toolId === "edit_move") return true;
        if (transformMode === "rotate" && toolId === "edit_rotate") return true;
        if (transformMode === "snap" && toolId === "edit_snap") return true;
        return false;
    };

    return (
        <div className="ui-design-tools">
            <div className="ui-design-tools-wrapper">
                {Object.entries(groupedTools).map(([groupName, tools]) => (
                    <div key={groupName} className="ui-design-tools-block">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <div className="ui-design-tools-title">{t(groupName as any, { fallback: groupName.toUpperCase() })}</div>
                        <div className="ui-design-tools-group">
                            {tools.map(tool => {
                                // SPECIAL CASES FOR CUSTOM POPOVERS AND COMPONENTS
                                if (tool.id === "edit_paint") {
                                    return (
                                        <Popover key={tool.id}>
                                            <PopoverTrigger asChild>
                                                <button className="ui-design-tools-btn" title={t("editPaint") || "Applicatore Texture/Materiale"}>
                                                    <Palette className="ui-design-tools-icon" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent side="top" align="center" className="ui-design-tools-popover" onInteractOutside={() => {}}>
                                                <div className="ui-design-tools-popover-title">Materiali & Texture</div>
                                                <div className="ui-design-tools-popover-group">
                                                    <div>
                                                        <div className="ui-design-tools-popover-label">Materiale Base</div>
                                                        <div className="ui-design-tools-popover-grid">
                                                            {typedCanvasMaterials.map((m) => (
                                                                <button
                                                                    key={m.id}
                                                                    className="ui-design-tools-color-btn"
                                                                    style={{ backgroundColor: m.baseColor }}
                                                                    title={m.name}
                                                                    onClick={() => executeMaterialApply(m.id, undefined)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="ui-design-tools-popover-label">Applica Colore/Texture</div>
                                                        <div className="ui-design-tools-popover-grid">
                                                            <button
                                                                className="ui-design-tools-clear-btn"
                                                                title="Nessuna Texture"
                                                                onClick={() => executeMaterialApply(undefined, "clear")}
                                                            >
                                                                <X className="ui-design-tools-clear-icon" />
                                                            </button>
                                                            {filteredTextures.map((t) => (
                                                                <button
                                                                    key={t.id}
                                                                    className="ui-design-tools-texture-btn"
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
                                    );
                                }

                                if (tool.id === "share_codesign" || tool.id === "share_link") {
                                    return (
                                        <Popover key={tool.id}>
                                            <PopoverTrigger asChild>
                                                <button className="ui-design-tools-btn" title={t(tool.name.split('.').pop() || tool.id)}>
                                                    {renderIcon(tool.icon as string)}
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent align="end" className="w-80 p-4 space-y-4">
                                                <div className="space-y-2">
                                                    <h4 className="font-medium text-sm">{t("shareDialogTitle")}</h4>
                                                    <p className="text-xs text-muted-foreground">{t("shareDialogDesc")}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <code className="flex-1 bg-muted p-2 rounded text-xs truncate select-all">{currentUrl}</code>
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
                                    );
                                }

                                if (tool.id === "general_locale") return <SwitchLocale key={tool.id} />;
                                if (tool.id === "general_theme") return <SwitchTheme key={tool.id} />;
                                if (tool.id === "general_mode") return <DesignDebug key={tool.id} />; // Temporary mapping for debug button

                                if (tool.id === "general_support") {
                                    return (
                                        <Link key={tool.id} href="/partner/support" className="ui-design-tools-btn" title={t("generalSupport", { fallback: "Support" })}>
                                            <Headset className="ui-design-tools-icon" />
                                        </Link>
                                    );
                                }

                                if (tool.id === "general_account") {
                                    return (
                                        <button
                                            key={tool.id}
                                            className="ui-design-tools-btn"
                                            title={user ? t("logout", { fallback: "Esci" }) : t("login", { fallback: "Accedi" })}
                                            onClick={handleDesignToolLogout}
                                        >
                                            {user ? (
                                                <>
                                                    <User className="ui-design-tools-icon" />
                                                    <div className="ui-design-tools-account-logout-badge">
                                                        <X size={10} />
                                                    </div>
                                                </>
                                            ) : (
                                                <LogIn className="ui-design-tools-icon" />
                                            )}
                                        </button>
                                    );
                                }

                                return (
                                    <button
                                        key={tool.id}
                                        className={`ui-design-tools-btn ${tool.id === 'edit_delete' ? 'ui-design-tools-btn-destructive' : ''}`}
                                        data-active={checkActive(tool.id)}
                                        onClick={() => handleToolClick(tool.id)}
                                        title={t(tool.name.split('.').pop() || tool.id)}
                                    >
                                        {renderIcon(tool.icon as string)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {xrError && (
                <div className="fixed inset-0 z-[9999] bg-background">
                    <ErrorGuard error={xrError} onBack={() => setXrError(null)} />
                </div>
            )}
        </div>
    );
}
