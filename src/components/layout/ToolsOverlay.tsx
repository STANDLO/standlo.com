import * as React from "react";
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
    if (!active) {
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
