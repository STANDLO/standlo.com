import * as React from "react"
import { ToolsOverlay } from "@/components/layout/ToolsOverlay"

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <ToolsOverlay variant="public" />
            <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto h-full items-center justify-center">
                {children}
            </main>
        </>
    )
}

