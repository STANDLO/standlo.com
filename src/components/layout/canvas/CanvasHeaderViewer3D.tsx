"use client";

import { Cuboid } from "lucide-react";
import { useCanvasStore } from "@/components/layout/canvas/store";

export function CanvasHeaderViewer3D() {
    const viewMode = useCanvasStore((state) => state.viewMode);
    const setViewMode = useCanvasStore((state) => state.setViewMode);

    return (
        <button
            onClick={() => setViewMode("3D")}
            className={`canvas-header-viewer-3d ui-canvas-toolbar-btn ${viewMode === "3D" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
        >
            <Cuboid className="ui-canvas-btn-icon" />
            3D
        </button>
    );
}
