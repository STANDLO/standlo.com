"use client";

import { useState } from "react";
import { ErrorGuard } from "@/components/ui/ErrorGuard";
import { useSearchParams } from "next/navigation";
import { useDesignStore } from "@/components/layout/design/store";
import { DesignHeader } from "@/components/layout/design/DesignHeader";
import { xrStore } from "@/components/layout/design/xrStore";
import { DesignCreationWizard } from "@/components/layout/design/DesignCreationWizard";
import { DesignPart } from "@/components/layout/design/DesignPart";
import { DesignAssembly } from "@/components/layout/design/DesignAssembly";
import { DesignDesign } from "@/components/layout/design/DesignDesign";
import { DesignHierarchyTree } from "@/components/layout/design/DesignHierarchyTree";
import { use } from "react";

export default function Design3DEditorPage({ params }: { params: Promise<{ roleId: string, locale: string }> }) {
    const { roleId, locale } = use(params);
    const searchParams = useSearchParams();
    const entityId = searchParams.get("id") as string; // Retrieve Design document ID
    const [xrError, setXrError] = useState<Error | null>(null);
    const mode = useDesignStore((state) => state.mode);
    const setViewMode = useDesignStore((state) => state.setViewMode);

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
        <div className="ui-design-root">
            {/* Header that overlaps the canvas or sits on top */}
            <DesignHeader roleId={roleId} entityId={entityId} onEnterXR={handleEnterXR} onExport={handleExport} />

            {/* Main Area (No Fixed Sidebars - Floating Only) */}
            <div className="ui-design-main-area relative">

                {/* 3D Viewport spans 100% of the main area - Rendered globally via DesignOverlay */}
                <main className="flex-1 w-full h-[calc(100vh-64px)] relative bg-transparent overflow-hidden pointer-events-none" />
                {/* Overlays / Floating Windows */}
                {!entityId ? (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex items-center justify-center">
                        <DesignCreationWizard roleId={roleId} locale={locale} />
                    </div>
                ) : (
                    <>
                        {/* Depending on mode, we show tool palettes */}
                        {mode === "part" && <DesignPart />}
                        {mode === "assembly" && <DesignAssembly />}
                        {mode === "design" && <DesignDesign />}
                        {/* The Hierarchy Tree is always visible when editing an entity */}
                        <DesignHierarchyTree entityId={entityId} />
                    </>
                )}
            </div>
        </div>
    );
}
