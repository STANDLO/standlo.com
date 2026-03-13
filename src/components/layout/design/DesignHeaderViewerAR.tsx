"use client";

import { Smartphone } from "lucide-react";
import { useDesignStore } from "@/components/layout/design/store";

interface Props {
    onEnterXR: (type: "VR" | "AR") => void;
}

export function DesignHeaderViewerAR({ onEnterXR }: Props) {
    const viewMode = useDesignStore((state) => state.viewMode);

    return (
        <button
            disabled
            onClick={() => onEnterXR("AR")}
            className={`design-header-viewer-ar ui-design-toolbar-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted-foreground ${viewMode === "AR" ? "ui-design-toolbar-btn-active" : "ui-design-toolbar-btn-inactive"}`}
        >
            <Smartphone className="ui-design-btn-icon" />
            AR
        </button>
    );
}
