import { useState } from "react";
import { Brain, Send } from "lucide-react";
import { DesignController } from "@/lib/design";
import { useDesignStore } from "@/components/layout/design/store";
import { useParams } from "next/navigation";

export function DesignAI() {
    const [promptText, setPromptText] = useState("");
    
    const params = useParams();
    const canvasId = (params?.uid as string) || (params?.entity as string);

    // Get current selected entity from zustand
    const selectedEntityId = useDesignStore(state => state.selectedEntityId);
    const selectedEntity = selectedEntityId ? useDesignStore.getState().entities[selectedEntityId] : null;

    const handlePromptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promptText.trim()) return;

        // Basic parsing for demonstration: #move
        if (promptText.includes("#move") && selectedEntityId && selectedEntity) {
            // parse basic commands like "sopra di 20 cm" (up by 0.2m)
            let newY = selectedEntity.position[1];
            if (promptText.toLowerCase().includes("sopra di 20")) {
                newY += 0.2;
            } else if (promptText.toLowerCase().includes("sopra")) {
                newY += 0.5; // generic UP
            }

            const newPos: [number, number, number] = [selectedEntity.position[0], newY, selectedEntity.position[2]];
            
            // Local update (moves the object visually in zustand)
            DesignController.moveEntity(selectedEntityId, newPos);

            // Network update (saves the change to orchestrator/DB so it stays)
            if (canvasId) {
                try {
                    const { callGateway } = await import("@/lib/api");
                    await callGateway("orchestrator", {
                        actionId: "updateNode",
                        payload: {
                            canvasId: canvasId,
                            nodeId: selectedEntityId,
                            position: newPos,
                            rotation: selectedEntity.rotation,
                            metadata: selectedEntity.metadata
                        }
                    });
                } catch (err) {
                    console.error("AI Prompt Gateway Error", err);
                }
            }
        }

        setPromptText("");
    };

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[28rem] max-w-[90vw] z-[100] bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden pointer-events-auto flex flex-col transition-all duration-300">
            {/* Context Header Area */}
            {selectedEntity ? (
                <div className="px-4 py-2 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
                    <div className="flex items-center gap-2">
                        <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300">
                            @ {selectedEntity.metadata?.name || selectedEntity.baseEntityId}
                        </div>
                        {promptText.includes("#move") && (
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/20 dark:text-fuchsia-300 transition-all opacity-100 scale-100">
                                # move
                            </div>
                        )}
                    </div>
                </div>
            ) : null}
            
            <form onSubmit={handlePromptSubmit} className="relative flex items-center p-2">
                <div className="pl-3 pr-2 text-indigo-500 dark:text-indigo-400">
                    <Brain className="w-5 h-5" />
                </div>
                <input 
                    type="text"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder={selectedEntity ? "Cosa vuoi fare con questo oggetto?" : "Seleziona un oggetto o scrivi un prompt..."}
                    className="flex-1 bg-transparent border-none outline-none py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-50"
                />
                <button 
                    type="submit" 
                    disabled={!promptText.trim()}
                    className="p-2 ml-2 rounded-full text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-50 disabled:hover:text-zinc-400 disabled:hover:bg-transparent transition-all pointer-events-auto focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
}
