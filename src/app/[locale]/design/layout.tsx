import { DesignOverlay } from "@/components/layout/DesignOverlay";

export default function CanvasLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <DesignOverlay />
            {children}
        </>
    );
}
