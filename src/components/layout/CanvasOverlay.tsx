"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Dynamically import the advanced Canvas with no SSR
const StandloCanvas = dynamic(() => import("./canvas/Canvas"), { ssr: false });

function CanvasOverlayInner({ active = true }: { active?: boolean }) {
    console.log("[Canvas Debug] CanvasOverlayInner Rendering. Active:", active);
    // We wrap useSearchParams in a component or suspense boundary to avoid Next.js de-opts
    const searchParams = useSearchParams();

    // Pass context from URL down to the global canvas if we happen to be in the editor route
    const entityId = searchParams?.get("id") || undefined;
    const entityType = searchParams?.get("type") || undefined;
    
    console.log("[Canvas Debug] CanvasOverlayInner search params parsed", { entityId, entityType });

    return (
        <StandloCanvas
            active={active}
            isOverlay={true}
            entityId={entityId}
            entityType={entityType}
        />
    );
}

export function CanvasOverlay({ active = true }: { active?: boolean }) {
    console.log("[Canvas Debug] CanvasOverlay Outer Wrapper Rendering. Active:", active);
    return (
        <div className="absolute inset-0 z-0 pointer-events-auto">
            <Suspense fallback={<div className="text-white z-50 absolute top-20 left-4 bg-black/50 p-2">Loading Canvas Suspense...</div>}>
                <CanvasOverlayInner active={active} />
            </Suspense>
        </div>
    );
}
