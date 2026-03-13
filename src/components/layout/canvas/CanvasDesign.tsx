import React from "react";
import { X } from "lucide-react";
import { useCanvasStore } from "./store";

export function CanvasDesign() {
    const { setMode } = useCanvasStore();

    return (
        <div className="absolute top-20 right-4 w-64 bg-background/95 backdrop-blur-md border rounded-xl shadow-lg z-10 flex flex-col pointer-events-auto">
            <div className="p-3 border-b flex justify-between items-center">
                <h3 className="text-sm font-semibold m-0">Add Design</h3>
                <button
                    onClick={() => setMode(null)}
                    className="p-1 hover:bg-muted rounded-md"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <div className="p-3">
                <input
                    type="text"
                    placeholder="Search designs..."
                    className="w-full h-8 px-3 rounded-md border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
            <div className="flex-1 overflow-y-auto p-3">
                <div className="text-xs text-muted-foreground text-center py-8">
                    Design search and insertion API to be integrated here.
                </div>
            </div>
        </div>
    );
}
