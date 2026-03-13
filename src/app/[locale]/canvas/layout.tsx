import { CanvasOverlay } from "@/components/layout/CanvasOverlay";

export default function CanvasLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <CanvasOverlay />
            {children}
        </>
    );
}
