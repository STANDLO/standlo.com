import * as React from "react"
import { PublicHeader } from "@/components/layout/PublicHeader"
import { PublicFooter } from "@/components/layout/PublicFooter"

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="layout-public-root">
            <PublicHeader />
            <main className="layout-main-body">
                {children}
            </main>
            <PublicFooter />
        </div>
    )
}
