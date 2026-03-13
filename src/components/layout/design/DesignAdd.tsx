"use client";

import { useDesignStore } from "@/lib/zustand";
import { DesignTools } from "../../../../functions/src/core/constants";
import { X } from "lucide-react";
import { Card } from "@/components/ui/Card";

// Sub-components
import { DesignSketchAdd } from "./DesignSketchAdd";
import { DesignPartAdd } from "./DesignPartAdd";
import { DesignAssemblyAdd } from "./DesignAssemblyAdd";
import { DesignBundleAdd } from "./DesignBundleAdd";
import { DesignDesignMerge } from "./DesignDesignMerge";

/**
 * Universal wrapper for adding elements to the 3D Design.
 * Interprets the current `store.mode` (e.g. 'part', 'sketch') and mounts the respective panel.
 */
export function DesignAdd() {
    const mode = useDesignStore((state) => state.mode);
    const setMode = useDesignStore((state) => state.setMode);

    if (!mode) return null;

    const activeTool = Object.values(DesignTools).find((t) => t.id === mode);
    if (!activeTool) return null;

    const renderContent = () => {
        switch (mode) {
            case "sketch":
                return <DesignSketchAdd />;
            case "part":
                return <DesignPartAdd />;
            case "assembly":
                return <DesignAssemblyAdd />;
            case "bundle":
                return <DesignBundleAdd />;
            case "design":
                return <DesignDesignMerge />;
            default:
                return <div className="p-4 text-xs text-zinc-500">Tool non implementato.</div>;
        }
    };

    return (
        <Card className="absolute left-1/2 -translate-x-1/2 bottom-20 z-50 w-[400px] shadow-2xl bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col max-h-[60vh]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                        Aggiungi {activeTool.name.split('.').pop()}
                    </span>
                </div>
                <button
                    onClick={() => setMode(null)}
                    className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {renderContent()}
            </div>
        </Card>
    );
}
