"use client";

import { Glasses } from "lucide-react";
import { useDesignStore } from "@/components/layout/design/store";

interface Props {
    onEnterXR: (type: "VR" | "AR") => void;
}

export function DesignHeaderViewerXR({ onEnterXR }: Props) {
    const viewMode = useDesignStore((state) => state.viewMode);

    return (
        <button
            disabled
            onClick={() => onEnterXR("VR")}
            className={`design-header-viewer-xr ui-design-toolbar-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted-foreground ${viewMode === "XR" ? "ui-design-toolbar-btn-active" : "ui-design-toolbar-btn-inactive"}`}
        >
            <Glasses className="ui-design-btn-icon" />
            XR
        </button>
    );
}
