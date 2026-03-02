"use client";

import { useState } from "react";
import { Cuboid, Box, Layers, Save, Undo, Redo, Download, Square, Glasses, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorGuard } from "@/components/ui/ErrorGuard";
import { useSearchParams } from "next/navigation";
import { useCanvasStore } from "@/components/canvas/store";
import CanvasEditor, { xrStore } from "@/components/canvas/CanvasEditor";
import { CanvasCreationWizard } from "@/components/canvas/CanvasCreationWizard";
import { CanvasParts } from "@/components/canvas/CanvasParts";
import { CanvasAssembly } from "@/components/canvas/CanvasAssembly";
import { CanvasHierarchyTree } from "@/components/canvas/CanvasHierarchyTree";
import { use } from "react";

export default function Canvas3DEditorPage({ params }: { params: Promise<{ roleId: string, locale: string }> }) {
    const { roleId, locale } = use(params);
    const searchParams = useSearchParams();
    const entityId = searchParams.get("id"); // Retrieve Canvas document ID
    const [xrError, setXrError] = useState<Error | null>(null);
    const mode = useCanvasStore((state) => state.mode);
    const setMode = useCanvasStore((state) => state.setMode);
    const viewMode = useCanvasStore((state) => state.viewMode);
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
            <header className="ui-canvas-header">
                <div className="ui-canvas-header-left">
                    <div className="ui-canvas-header-icon-box">
                        <Cuboid className="ui-canvas-header-icon" />
                    </div>
                    <div>
                        <h1 className="ui-canvas-header-title">Design System</h1>
                        <p className="ui-canvas-header-subtitle">Temporary Information Modeling</p>
                    </div>
                </div>

                <div className="ui-canvas-header-right">
                    <div className="ui-canvas-toolbar-group">
                        <button
                            onClick={() => setMode("part")}
                            className={`ui-canvas-toolbar-btn ${mode === "part" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
                        >
                            <Cuboid className="ui-canvas-btn-icon" />
                            Part
                        </button>
                        <button
                            onClick={() => setMode("assembly")}
                            className={`ui-canvas-toolbar-btn ${mode === "assembly" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
                        >
                            <Layers className="ui-canvas-btn-icon" />
                            Assembly
                        </button>
                        <button
                            onClick={() => setMode("stand")}
                            className={`ui-canvas-toolbar-btn ${mode === "stand" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
                        >
                            <Box className="ui-canvas-btn-icon" />
                            Stand
                        </button>
                    </div>

                    <div className="ui-canvas-separator" />

                    <div className="ui-canvas-toolbar-group">
                        <button
                            onClick={() => setViewMode("2D")}
                            className={`ui-canvas-toolbar-btn ${viewMode === "2D" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
                        >
                            <Square className="ui-canvas-btn-icon" />
                            2D
                        </button>
                        <button
                            onClick={() => setViewMode("3D")}
                            className={`ui-canvas-toolbar-btn ${viewMode === "3D" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
                        >
                            <Cuboid className="ui-canvas-btn-icon" />
                            3D
                        </button>
                        <button
                            onClick={() => handleEnterXR("VR")}
                            className={`ui-canvas-toolbar-btn ${viewMode === "XR" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
                        >
                            <Glasses className="ui-canvas-btn-icon" />
                            XR
                        </button>
                        <button
                            onClick={() => handleEnterXR("AR")}
                            className={`ui-canvas-toolbar-btn ${viewMode === "AR" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
                        >
                            <Smartphone className="ui-canvas-btn-icon" />
                            AR
                        </button>
                    </div>

                    <Button variant="secondary" size="icon" className="ui-canvas-action-btn">
                        <Undo className="ui-canvas-action-icon" />
                    </Button>
                    <Button variant="secondary" size="icon" className="ui-canvas-action-btn">
                        <Redo className="ui-canvas-action-icon" />
                    </Button>
                    <div className="ui-canvas-separator" />
                    <Button variant="outline" size="sm" className="ui-canvas-export-btn" onClick={handleExport}>
                        <Download className="ui-canvas-export-icon" />
                        Export
                    </Button>
                    <Button variant="primary" size="sm" className="ui-canvas-save-btn">
                        <Save className="ui-canvas-save-icon" />
                        Save
                    </Button>
                </div>
            </header>

            {/* Main Area (No Fixed Sidebars - Floating Only) */}
            <div className="ui-canvas-main-area relative">

                {/* 3D Viewport spans 100% of the main area */}
                <main className="ui-canvas-viewport h-full w-full absolute inset-0">
                    <CanvasEditor />
                </main>

                {/* Overlays / Floating Windows */}
                {!entityId ? (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-30 flex items-center justify-center">
                        <CanvasCreationWizard roleId={roleId} locale={locale} />
                    </div>
                ) : (
                    <>
                        {/* Depending on mode, we show tool palettes */}
                        {mode === "part" && <CanvasParts />}
                        {mode === "assembly" && <CanvasAssembly />}
                        {/* The Hierarchy Tree is always visible when editing an entity */}
                        <CanvasHierarchyTree />
                    </>
                )}
            </div>
        </div>
    );
}
