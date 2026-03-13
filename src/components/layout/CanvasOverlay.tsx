"use client";

import dynamic from "next/dynamic";
import { useSearchParams, usePathname } from "next/navigation";
import { Suspense } from "react";

// Dynamically import the advanced Canvas with no SSR
const StandloCanvas = dynamic(() => import("./canvas/Canvas"), { ssr: false });

function CanvasOverlayInner({ active = true }: { active?: boolean }) {
    // We wrap useSearchParams in a component or suspense boundary to avoid Next.js de-opts
    const searchParams = useSearchParams();
    const pathname = usePathname();

    // Pass context from URL down to the global canvas if we happen to be in the editor route
    let entityId = searchParams?.get("id") || undefined;
    let entityType = searchParams?.get("type") || undefined;

    // Support for public canvas sharing paths: /[locale]/canvas/public/[uid]
    if (!entityId && pathname) {
        const publicMatch = pathname.match(/\/canvas\/public\/([a-zA-Z0-9-]+)/);
        if (publicMatch && publicMatch[1]) {
            entityId = publicMatch[1];
            entityType = "canvas"; // Sandbox canvases evaluate as canvas
        }
    }

    return (
        <StandloCanvas
            active={active}
            isOverlay={true}
            entityId={entityId}
            entityType={entityType as "part" | "assembly" | "design" | "bundle" | "canvas" | undefined}
        />
    );
}

export function CanvasOverlay({ active = true }: { active?: boolean }) {
    const pathname = usePathname();
    const isCanvasRoute = pathname?.includes("/canvas");
    const finalActive = active || isCanvasRoute;

    return (
        <div className="absolute inset-0 z-0 pointer-events-auto">
            <Suspense fallback={null}>
                <CanvasOverlayInner active={finalActive} />
            </Suspense>
        </div>
    );
}
