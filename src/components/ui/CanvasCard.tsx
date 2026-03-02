import React, { ReactNode } from "react";
import { X } from "lucide-react";

interface CanvasCardProps {
    title: string | ReactNode;
    children: ReactNode;
    onClose?: () => void;
    position?: "left" | "right" | "center" | "bottom-right" | "top-right";
    width?: string;
    className?: string; // Additional classes for overriding standard behaviors
}

export function CanvasCard({
    title,
    children,
    onClose,
    position = "right",
    width = "w-80",
    className = ""
}: CanvasCardProps) {
    // Determine absolute positioning classes based on standard locations
    // This allows it to float above the canvas
    const getPositionClasses = () => {
        switch (position) {
            case "left": return "left-4 top-20 bottom-4";
            case "right": return "right-4 top-20 bottom-4";
            case "top-right": return "right-4 top-20 h-auto max-h-[60vh]";
            case "bottom-right": return "right-4 bottom-4 h-auto max-h-[40vh]";
            case "center": return "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-auto max-h-[80vh]";
            default: return "";
        }
    };

    return (
        <div
            className={`
                absolute flex flex-col z-40
                rounded-2xl border border-border/50 shadow-2xl
                bg-background/80 backdrop-blur-md
                overflow-hidden ${width} ${getPositionClasses()} ${className}
            `}
        >
            <div className="flex shrink-0 items-center justify-between p-4 border-b border-border/10 bg-muted/20">
                <h3 className="font-semibold text-sm tracking-tight flex items-center gap-2">
                    {title}
                </h3>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 rounded hover:bg-muted/50 text-muted-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* The scrollable body of the card */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {children}
            </div>
        </div>
    );
}
