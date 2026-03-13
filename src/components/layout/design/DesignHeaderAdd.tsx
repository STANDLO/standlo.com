"use client";

import { Cuboid, Box, Layers } from "lucide-react";
import { useDesignStore } from "@/components/layout/design/store";

interface DesignHeaderAddProps {
    roleId: string;
    entityId: string | null;
}

export function DesignHeaderAdd({ roleId, entityId }: DesignHeaderAddProps) {
    const mode = useDesignStore((state) => state.mode);
    const setMode = useDesignStore((state) => state.setMode);

    const allowedRoles = ["standlo_design", "architect", "engeener", "designer"];
    if (!allowedRoles.includes(roleId)) {
        return null;
    }

    const disabled = !entityId;

    return (
        <div className="ui-design-toolbar-group">
            <button
                disabled={disabled}
                onClick={() => setMode(mode === "part" ? null : "part")}
                className={`ui-design-toolbar-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted-foreground ${mode === "part" ? "ui-design-toolbar-btn-active" : "ui-design-toolbar-btn-inactive"}`}
            >
                <Cuboid className="ui-design-btn-icon" />
                Part
            </button>
            <button
                disabled={disabled}
                onClick={() => setMode(mode === "assembly" ? null : "assembly")}
                className={`ui-design-toolbar-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted-foreground ${mode === "assembly" ? "ui-design-toolbar-btn-active" : "ui-design-toolbar-btn-inactive"}`}
            >
                <Layers className="ui-design-btn-icon" />
                Assembly
            </button>
            <button
                disabled={disabled}
                onClick={() => setMode(mode === "design" ? null : "design")}
                className={`ui-design-toolbar-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted-foreground ${mode === "design" ? "ui-design-toolbar-btn-active" : "ui-design-toolbar-btn-inactive"}`}
            >
                <Box className="ui-design-btn-icon" />
                Design
            </button>
        </div>
    );
}
