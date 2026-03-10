"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToolsMainSidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    isCollapsed?: boolean
}

export const ToolsMainSidebar = React.forwardRef<HTMLDivElement, ToolsMainSidebarProps>(
    ({ className, isCollapsed = true, children, ...props }, ref) => {
        return (
            <aside
                ref={ref}
                className={cn(
                    "ui-tools-main-sidebar",
                    isCollapsed ? "ui-tools-main-sidebar--collapsed" : "ui-tools-main-sidebar--expanded",
                    className
                )}
                {...props}
            >
                <div className="ui-tools-main-sidebar-content">
                    {children}
                </div>
            </aside>
        )
    }
)
ToolsMainSidebar.displayName = "ToolsMainSidebar"
