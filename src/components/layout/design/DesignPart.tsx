import React from "react";
import { DesignCard } from "@/components/ui/DesignCard";
import { Search, Cuboid, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useDesignStore } from "./store";
import { v4 as uuidv4 } from "uuid";

// Dummy data for visual representation until hooked up to React Query + AST
const DUMMY_PARTS = [
    { id: "1", name: "Aluminium Profile 2m", category: "Structure" },
    { id: "2", name: "Standard 1x1m Panel", category: "Walls" },
    { id: "3", name: "LED Spot 50W", category: "Lighting" },
    { id: "4", name: "M8 Screw", category: "Hardware" }
];

export function DesignPart() {
    const addEntity = useDesignStore((state) => state.addEntity);
    const getNextOrder = useDesignStore((state) => state.getNextOrder);

    const handleAdd = (part: typeof DUMMY_PARTS[0]) => {
        addEntity({
            id: uuidv4(),
            baseEntityId: part.name.toLowerCase().includes("panel") ? "parametric_box_panel" : "parametric_cylinder_pillar",
            type: "part",
            order: getNextOrder(),
            position: [0, 1, 0], // Drop from slightly above
            rotation: [0, 0, 0, 1],
            sockets: [
                { id: uuidv4(), type: "male", position: [0.5, 0, 0], rotation: [0, 0, 0, 1] },
                { id: uuidv4(), type: "female", position: [-0.5, 0, 0], rotation: [0, 0, 0, 1] }
            ]
        });
    };

    return (
        <DesignCard
            title={
                <React.Fragment>
                    <Cuboid className="w-4 h-4 text-blue-500" />
                    Parts Library
                </React.Fragment>
            }
            position="right"
            width="w-72"
        >
            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search parts catalog..."
                    className="w-full bg-muted/50 border border-border/50 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                />
            </div>

            <div className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Available Parts</div>

                {DUMMY_PARTS.map(part => (
                    <div
                        key={part.id}
                        className="group flex items-center justify-between p-2 rounded-lg border border-transparent hover:bg-muted/30 hover:border-border/50 transition-all cursor-pointer"
                    >
                        <div>
                            <div className="text-sm font-medium">{part.name}</div>
                            <div className="text-xs text-muted-foreground">{part.category}</div>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 h-7 w-7 transition-opacity border-none"
                            onClick={() => handleAdd(part)}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border/10">
                <Button variant="outline" className="w-full text-xs" size="sm">Open Full Catalog</Button>
            </div>
        </DesignCard>
    );
}
