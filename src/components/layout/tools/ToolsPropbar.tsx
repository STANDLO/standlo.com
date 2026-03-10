"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ToolsPropbarProps extends React.HTMLAttributes<HTMLDivElement> {
    isCollapsed?: boolean
}

export const ToolsPropbar = React.forwardRef<HTMLDivElement, ToolsPropbarProps>(
    ({ className, isCollapsed = true, children, ...props }, ref) => {
        return (
            <aside
                ref={ref}
                className={cn(
                    "ui-tools-main-propbar",
                    isCollapsed ? "w-[64px]" : "w-[240px]", // Or 320px depending on the propbar needs
                    className
                )}
                {...props}
            >
                {/* Optional toggle button area could go here */}
                {/* {onToggle && <button onClick={onToggle}>Toggle</button>} */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    {children}
                </div>
            </aside>
        )
    }
)
ToolsPropbar.displayName = "ToolsPropbar"
