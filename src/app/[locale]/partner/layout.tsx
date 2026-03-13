import { ToolsOverlay } from "@/components/layout/ToolsOverlay";

export default function PartnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToolsOverlay>
            {children}
        </ToolsOverlay>
    );
}
