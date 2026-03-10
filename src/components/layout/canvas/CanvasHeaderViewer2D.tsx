"use client";

import { Square } from "lucide-react";
import { useCanvasStore } from "@/components/layout/canvas/store";

export function CanvasHeaderViewer2D() {
    const viewMode = useCanvasStore((state) => state.viewMode);
    const setViewMode = useCanvasStore((state) => state.setViewMode);

    return (
        <button
            onClick={() => setViewMode("2D")}
            className={`canvas-header-viewer-2d ui-canvas-toolbar-btn ${viewMode === "2D" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
        >
            <Square className="ui-canvas-btn-icon" />
            2D
        </button>
    );
}
