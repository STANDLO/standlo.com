"use client";

import { Smartphone } from "lucide-react";
import { useCanvasStore } from "@/components/layout/canvas/store";

interface Props {
    onEnterXR: (type: "VR" | "AR") => void;
}

export function CanvasHeaderViewerAR({ onEnterXR }: Props) {
    const viewMode = useCanvasStore((state) => state.viewMode);

    return (
        <button
            disabled
            onClick={() => onEnterXR("AR")}
            className={`canvas-header-viewer-ar ui-canvas-toolbar-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted-foreground ${viewMode === "AR" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
        >
            <Smartphone className="ui-canvas-btn-icon" />
            AR
        </button>
    );
}
