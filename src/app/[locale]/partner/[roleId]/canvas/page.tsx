"use client";

import { useState } from "react";
import { ErrorGuard } from "@/components/ui/ErrorGuard";
import { useSearchParams } from "next/navigation";
import { useCanvasStore } from "@/components/layout/canvas/store";
import { CanvasHeader } from "@/components/layout/canvas/CanvasHeader";
import { xrStore } from "@/components/layout/canvas/Canvas";
import { CanvasCreationWizard } from "@/components/layout/canvas/CanvasCreationWizard";
import { CanvasPart } from "@/components/layout/canvas/CanvasPart";
import { CanvasAssembly } from "@/components/layout/canvas/CanvasAssembly";
import { CanvasStand } from "@/components/layout/canvas/CanvasStand";
import { CanvasHierarchyTree } from "@/components/layout/canvas/CanvasHierarchyTree";
import { use } from "react";

export default function Canvas3DEditorPage({ params }: { params: Promise<{ roleId: string, locale: string }> }) {
    const { roleId, locale } = use(params);
    const searchParams = useSearchParams();
    const entityId = searchParams.get("id") as string; // Retrieve Canvas document ID
    const [xrError, setXrError] = useState<Error | null>(null);
    const mode = useCanvasStore((state) => state.mode);
    const setViewMode = useCanvasStore((state) => state.setViewMode);

    const handleEnterXR = async (type: "VR" | "AR") => {
        try {
            if (type === "VR") {
                setViewMode("XR");
                await xrStore.enterVR();
            } else {
                setViewMode("AR");
                await xrStore.enterAR();
            }
        } catch (error: unknown) {
            console.error(`XR/AR Support Error [${type}]:`, error);
            // Revert back safely in the background
            setViewMode("3D");
            // Show the professional ErrorGuard UI instead of a native alert
            setXrError(new Error(`Impossibile avviare la modalità ${type === "VR" ? "XR" : "AR"}: Hardware o browser non supportato.`));
        }
    };

    const handleExport = () => {
        const canvas = document.querySelector('canvas');
        if (canvas) {
            const dataUrl = canvas.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = `standlo-snapshot-${new Date().getTime()}.png`;
            a.click();
        }
    };

    if (xrError) {
        // Return full-screen ErrorGuard to match typical portal error states
        return <ErrorGuard error={xrError} />;
    }


    return (
        <div className="ui-canvas-root">
            {/* Header that overlaps the canvas or sits on top */}
            <CanvasHeader roleId={roleId} entityId={entityId} onEnterXR={handleEnterXR} onExport={handleExport} />

            {/* Main Area (No Fixed Sidebars - Floating Only) */}
            <div className="ui-canvas-main-area relative">

                {/* 3D Viewport spans 100% of the main area - Rendered globally via CanvasOverlay */}
                <main className="flex-1 w-full h-[calc(100vh-64px)] relative bg-transparent overflow-hidden pointer-events-none" />
                {/* Overlays / Floating Windows */}
                {!entityId ? (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex items-center justify-center">
                        <CanvasCreationWizard roleId={roleId} locale={locale} />
                    </div>
                ) : (
                    <>
                        {/* Depending on mode, we show tool palettes */}
                        {mode === "part" && <CanvasPart />}
                        {mode === "assembly" && <CanvasAssembly />}
                        {mode === "stand" && <CanvasStand />}
                        {/* The Hierarchy Tree is always visible when editing an entity */}
                        <CanvasHierarchyTree entityId={entityId} />
                    </>
                )}
            </div>
        </div>
    );
}
