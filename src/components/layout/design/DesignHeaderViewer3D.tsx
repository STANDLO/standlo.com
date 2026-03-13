"use client";

import { Cuboid } from "lucide-react";
import { useDesignStore } from "@/components/layout/design/store";

export function DesignHeaderViewer3D() {
    const viewMode = useDesignStore((state) => state.viewMode);
    const setViewMode = useDesignStore((state) => state.setViewMode);

    return (
        <button
            onClick={() => setViewMode("3D")}
            className={`design-header-viewer-3d ui-design-toolbar-btn ${viewMode === "3D" ? "ui-design-toolbar-btn-active" : "ui-design-toolbar-btn-inactive"}`}
        >
            <Cuboid className="ui-design-btn-icon" />
            3D
        </button>
    );
}
