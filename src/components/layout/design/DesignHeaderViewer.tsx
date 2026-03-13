"use client";

import { DesignHeaderViewer2D } from "./DesignHeaderViewer2D";
import { DesignHeaderViewer3D } from "./DesignHeaderViewer3D";
import { DesignHeaderViewerXR } from "./DesignHeaderViewerXR";
import { DesignHeaderViewerAR } from "./DesignHeaderViewerAR";

interface Props {
    onEnterXR: (type: "VR" | "AR") => void;
}

export function DesignHeaderViewer({ onEnterXR }: Props) {
    return (
        <div className="ui-design-viewer">
            <DesignHeaderViewer2D />
            <DesignHeaderViewer3D />
            <DesignHeaderViewerXR onEnterXR={onEnterXR} />
            <DesignHeaderViewerAR onEnterXR={onEnterXR} />
        </div>
    );
}
