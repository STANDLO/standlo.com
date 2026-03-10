"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export const ToolsMainContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <main
                ref={ref}
                className={cn("ui-tools-main-content", className)}
                {...props}
            >
                {children}
            </main>
        )
    }
)
ToolsMainContent.displayName = "ToolsMainContent"
