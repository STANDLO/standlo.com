"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export const ToolsMain = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn("ui-tools-main", className)}
                {...props}
            >
                {children}
            </div>
        )
    }
)
ToolsMain.displayName = "ToolsMain"
