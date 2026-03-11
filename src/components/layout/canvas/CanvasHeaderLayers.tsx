"use client";

import { Layers } from "lucide-react";
import { useCanvasStore } from "./store";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { Button } from "@/components/ui/Button";

const CANVAS_LAYERS = [
    { id: "appendimento", label: "Appendimento" },
    { id: "pavimento", label: "Pavimento" },
    { id: "pareti", label: "Pareti" },
    { id: "strutture", label: "Strutture" },
    { id: "impianto", label: "Impianti" },
    { id: "arredo", label: "Arredo" },
    { id: "grafiche", label: "Grafiche" },
    { id: "consumabili", label: "Consumabili" }
];

export function CanvasHeaderLayers() {
    const activeLayer = useCanvasStore((state) => state.activeLayer);
    const setActiveLayer = useCanvasStore((state) => state.setActiveLayer);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    variant={activeLayer ? "default" : "outline"} 
                    size="sm" 
                    className="flex items-center gap-2"
                >
                    <Layers className="w-4 h-4" />
                    <span className="max-w-[100px] truncate">
                        {activeLayer ? CANVAS_LAYERS.find(l => l.id === activeLayer)?.label : "Tutti i Livelli"}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Gestione Livelli</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={activeLayer || "all"} onValueChange={(v) => setActiveLayer(v === "all" ? null : v)}>
                    <DropdownMenuRadioItem value="all">
                        Tutti i Livelli (Nessun ghosting)
                    </DropdownMenuRadioItem>
                    <DropdownMenuSeparator />
                    {CANVAS_LAYERS.map(layer => (
                        <DropdownMenuRadioItem key={layer.id} value={layer.id}>
                            {layer.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
