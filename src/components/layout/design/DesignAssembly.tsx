import React from "react";
import { DesignCard } from "@/components/ui/DesignCard";
import { Search, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Dummy data
const DUMMY_ASSEMBLIES = [
    { id: "10", name: "Standard Reception Desk", partsCount: 15 },
    { id: "11", name: "Truss Pillar 3m", partsCount: 42 },
    { id: "12", name: "Monitor Stand + TV 55\"", partsCount: 8 }
];

export function DesignAssembly() {
    return (
        <DesignCard
            title={
                <React.Fragment>
                    <Layers className="w-4 h-4 text-purple-500" />
                    Assemblies
                </React.Fragment>
            }
            position="right" // Placed differently than parts, but can be customized
            width="w-72"
        >
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search standard assemblies..."
                    className="w-full bg-muted/50 border border-border/50 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
            </div>

            <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Predefined Assemblies</div>

                {DUMMY_ASSEMBLIES.map(assembly => (
                    <div
                        key={assembly.id}
                        className="group flex items-center justify-between p-2 rounded-lg border border-transparent hover:bg-muted/30 hover:border-border/50 transition-all cursor-pointer"
                    >
                        <div>
                            <div className="text-sm font-medium">{assembly.name}</div>
                            <div className="text-xs text-muted-foreground">{assembly.partsCount} constituent parts</div>
                        </div>
                        <Button variant="outline" size="icon" className="opacity-0 group-hover:opacity-100 h-7 w-7 transition-opacity border-none shadow-none">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </DesignCard>
    );
}
