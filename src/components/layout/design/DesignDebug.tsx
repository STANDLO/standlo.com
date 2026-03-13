import { useState } from "react";
import { Bug, Play, Trash2, Database, Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { DesignController } from "@/lib/design";
import { runInstancingStressTest, runSpatialQATest } from "@/scripts/design-ai-stress-test";
import { useDesignStore } from "@/lib/zustand";
import { useParams } from "next/navigation";

export function DesignDebug() {
    const [isOpen, setIsOpen] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isQATesting, setIsQATesting] = useState(false);
    const [syncDb, setSyncDb] = useState(false);

    const params = useParams();
    const canvasId = (params?.uid as string) || (params?.entity as string);
    const [nodeCount, setNodeCount] = useState(500);

    // Only render on localhost
    //if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    //    return null;
    //}

    // Fallback for SSR
    if (typeof window === 'undefined') {
        return null;
    }

    const downloadZustandState = () => {
        const state = useDesignStore.getState();

        const {
            entities,
            materialsRegistry,
            texturesRegistry,
            viewMode,
            cameraMode,
            activeLayer,
            mode
        } = state;

        const dump = {
            timestamp: new Date().toISOString(),
            canvasId,
            metrics: {
                totalEntities: Object.keys(entities).length,
                totalMaterials: materialsRegistry?.length || 0,
                totalTextures: texturesRegistry?.length || 0,
            },
            state: {
                entities,
                materialsRegistry,
                texturesRegistry,
                viewMode,
                cameraMode,
                activeLayer,
                mode
            }
        };

        const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `canvas-state-${canvasId || 'local'}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };


    const runStressTest = async () => {
        setIsTesting(true);
        setTimeout(async () => {
            await runInstancingStressTest(nodeCount, 50, syncDb, canvasId);
            setIsTesting(false);

            // Auto download for AI validation
            downloadZustandState();

            if (!syncDb) setIsOpen(false);
        }, 100);
    };

    const runQATest = async () => {
        setIsQATesting(true);
        setTimeout(async () => {
            await runSpatialQATest(50, 50); // 50 loops, 50ms delay
            setIsQATesting(false);
        }, 100);
    };

    const clearCanvas = () => {
        DesignController.clearAll();
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className="ui-design-tools-btn h-10 w-10 flex items-center justify-center p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    data-active={isOpen}
                    title="Canvas Debug & Stress Test"
                >
                    <Bug className="w-5 h-5 text-orange-500" />
                </button>
            </PopoverTrigger>
            <PopoverContent
                side="top"
                align="center"
                className="w-80 p-0 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 shadow-2xl z-[9999] overflow-hidden rounded-xl"
            >
                {/* Header */}
                <div className="flex items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/10">
                    <Bug className="w-4 h-4 text-orange-500" />
                    <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Canvas Debug</div>
                </div>

                {/* Stress Test Section */}
                <div className="p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/20">
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                        Test Strutturale Data-Driven: Genera nodi multipli per verificare latenza e framerate.
                    </p>

                    <div className="flex items-center justify-between">
                        <label className="text-xs text-zinc-700 dark:text-zinc-300">Nodi da generare:</label>
                        <input
                            type="number"
                            min="10"
                            max="5000"
                            value={nodeCount}
                            onChange={(e) => setNodeCount(Number(e.target.value))}
                            className="w-16 text-xs px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded outline-none focus:border-orange-500 text-right"
                        />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${syncDb ? 'bg-orange-500 border-orange-500' : 'border-zinc-300 dark:border-zinc-700 group-hover:border-orange-500/50'}`}>
                            {syncDb && <Database className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 select-none">
                            Sync to DB (Orchestrator Proxy)
                        </span>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={syncDb}
                            onChange={(e) => setSyncDb(e.target.checked)}
                        />
                    </label>

                    <div className="flex gap-2">
                        <button
                            className="flex-1 flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold py-2 px-3 rounded shadow-sm shadow-orange-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                            onClick={runStressTest}
                            disabled={isTesting}
                        >
                            <Play className="w-3 h-3" />
                            {isTesting ? "In elaborazione..." : `Genera ${nodeCount} Nodi`}
                        </button>

                        <button
                            className="flex-none flex items-center justify-center bg-white dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-700 dark:text-zinc-300 hover:text-red-500 border border-zinc-200 dark:border-white/10 hover:border-red-200 dark:hover:border-red-900/50 text-xs px-3 rounded transition-all active:scale-[0.98] focus:outline-none"
                            onClick={clearCanvas}
                            title="Svuota Canvas Locale"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <button
                        className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-3 rounded shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                        onClick={runQATest}
                        disabled={isQATesting || isTesting}
                    >
                        <Play className="w-3 h-3" />
                        {isQATesting ? "QA in progress..." : "Run Spatial QA Sequence"}
                    </button>
                </div>

                {/* State Dump Section */}
                <div className="p-3 bg-zinc-100 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-white/10">
                    <button
                        className="w-full flex items-center justify-center gap-1.5 bg-zinc-800 dark:bg-white hover:bg-zinc-700 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-semibold py-2 px-3 rounded shadow-sm shadow-zinc-500/10 transition-all active:scale-[0.98]"
                        onClick={downloadZustandState}
                    >
                        <Download className="w-3 h-3" />
                        Scarica Dump Zustand (JSON)
                    </button>
                    <p className="mt-2 text-[10px] text-zinc-400 dark:text-zinc-500 text-center leading-tight">
                        Esporta struttura datiEntities per convalida architettura
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    );
}
