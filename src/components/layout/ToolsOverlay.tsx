import * as React from "react";
import { ToolsLogo } from "./tools/ToolsLogo";
import { ToolsNavigator, NavItem } from "./tools/ToolsNavigator";

interface ToolsOverlayProps {
    variant?: 'public' | 'protected';
    navItems?: NavItem[];
    roleContext?: string;
    userName?: string;
    organizationName?: string;
}


export function ToolsOverlay({ variant = 'public', navItems, roleContext, userName, organizationName }: ToolsOverlayProps) {
    return (
        <div className="absolute inset-0 pointer-events-none z-50">
            <ToolsLogo />
            <ToolsNavigator
                variant={variant}
                navItems={navItems}
                roleContext={roleContext}
                userName={userName}
                organizationName={organizationName}
            />
        </div>
    );
}
