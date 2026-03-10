"use client";

import { Glasses } from "lucide-react";
import { useCanvasStore } from "@/components/layout/canvas/store";

interface Props {
    onEnterXR: (type: "VR" | "AR") => void;
}

export function CanvasHeaderViewerXR({ onEnterXR }: Props) {
    const viewMode = useCanvasStore((state) => state.viewMode);

    return (
        <button
            disabled
            onClick={() => onEnterXR("VR")}
            className={`canvas-header-viewer-xr ui-canvas-toolbar-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted-foreground ${viewMode === "XR" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
        >
            <Glasses className="ui-canvas-btn-icon" />
            XR
        </button>
    );
}
