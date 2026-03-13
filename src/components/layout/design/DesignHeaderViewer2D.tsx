"use client";

import { Square } from "lucide-react";
import { useDesignStore } from "@/components/layout/design/store";

export function DesignHeaderViewer2D() {
    const viewMode = useDesignStore((state) => state.viewMode);
    const setViewMode = useDesignStore((state) => state.setViewMode);

    return (
        <button
            onClick={() => setViewMode("2D")}
            className={`design-header-viewer-2d ui-design-toolbar-btn ${viewMode === "2D" ? "ui-design-toolbar-btn-active" : "ui-design-toolbar-btn-inactive"}`}
        >
            <Square className="ui-design-btn-icon" />
            2D
        </button>
    );
}
