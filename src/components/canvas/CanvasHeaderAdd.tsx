"use client";

import { Cuboid, Box, Layers } from "lucide-react";
import { useCanvasStore } from "@/components/canvas/store";

interface CanvasHeaderAddProps {
    roleId: string;
    entityId: string | null;
}

export function CanvasHeaderAdd({ roleId, entityId }: CanvasHeaderAddProps) {
    const mode = useCanvasStore((state) => state.mode);
    const setMode = useCanvasStore((state) => state.setMode);

    const allowedRoles = ["standlo_design", "architect", "engeener", "designer"];
    if (!allowedRoles.includes(roleId)) {
        return null;
    }

    const disabled = !entityId;

    return (
        <div className="ui-canvas-toolbar-group">
            <button
                disabled={disabled}
                onClick={() => setMode(mode === "part" ? null : "part")}
                className={`ui-canvas-toolbar-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted-foreground ${mode === "part" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
            >
                <Cuboid className="ui-canvas-btn-icon" />
                Part
            </button>
            <button
                disabled={disabled}
                onClick={() => setMode(mode === "assembly" ? null : "assembly")}
                className={`ui-canvas-toolbar-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted-foreground ${mode === "assembly" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
            >
                <Layers className="ui-canvas-btn-icon" />
                Assembly
            </button>
            <button
                disabled={disabled}
                onClick={() => setMode(mode === "stand" ? null : "stand")}
                className={`ui-canvas-toolbar-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted-foreground ${mode === "stand" ? "ui-canvas-toolbar-btn-active" : "ui-canvas-toolbar-btn-inactive"}`}
            >
                <Box className="ui-canvas-btn-icon" />
                Stand
            </button>
        </div>
    );
}
