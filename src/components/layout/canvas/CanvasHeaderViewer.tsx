"use client";

import { CanvasHeaderViewer2D } from "./CanvasHeaderViewer2D";
import { CanvasHeaderViewer3D } from "./CanvasHeaderViewer3D";
import { CanvasHeaderViewerXR } from "./CanvasHeaderViewerXR";
import { CanvasHeaderViewerAR } from "./CanvasHeaderViewerAR";

interface Props {
    onEnterXR: (type: "VR" | "AR") => void;
}

export function CanvasHeaderViewer({ onEnterXR }: Props) {
    return (
        <div className="ui-canvas-viewer">
            <CanvasHeaderViewer2D />
            <CanvasHeaderViewer3D />
            <CanvasHeaderViewerXR onEnterXR={onEnterXR} />
            <CanvasHeaderViewerAR onEnterXR={onEnterXR} />
        </div>
    );
}
