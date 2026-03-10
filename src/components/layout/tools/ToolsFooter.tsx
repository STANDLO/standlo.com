"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export const ToolsFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        return (
            <footer
                ref={ref}
                className={cn("ui-tools-footer", className)}
                {...props}
            >
                {children}
            </footer>
        )
    }
)
ToolsFooter.displayName = "ToolsFooter"
