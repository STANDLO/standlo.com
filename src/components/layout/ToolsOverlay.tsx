"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ToolsMain } from "./tools/ToolsMain";
import { ToolsMainSidebar } from "./tools/ToolsMainSidebar";
import { ToolsMainContent } from "./tools/ToolsMainContent";
import { ToolsPropbar } from "./tools/ToolsPropbar";

interface ToolsOverlayProps {
    active?: boolean;
    roleContext?: string;
    userName?: string;
    organizationName?: string;
    children?: React.ReactNode;
}

export function ToolsOverlay({ active = true, children }: ToolsOverlayProps) {
    const pathname = usePathname();
    const isCanvasRoute = pathname?.endsWith("/canvas");
    
    // Tools should naturally deactivate on canvas direct routes
    const finalActive = active && !isCanvasRoute;

    if (!finalActive) {
        return <>{children}</>;
    }

    return (
        <div className="tool">
            <ToolsMain>
                <ToolsMainSidebar isCollapsed={true} />
                <ToolsMainContent>
                    {children}
                </ToolsMainContent>
                <ToolsPropbar isCollapsed={true} />
            </ToolsMain>
        </div>
    );
}
