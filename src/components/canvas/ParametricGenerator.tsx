"use client";

import { useState } from "react";
import { useCanvasStore, SocketDefinition } from "./store";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * A UI Panel that generates parametric 3D shapes (Boxes, Cylinders)
 * and dispatches them to the Zustand Canvas Store.
 */
export default function ParametricGenerator() {
    const addEntity = useCanvasStore((state) => state.addEntity);
    const mode = useCanvasStore((state) => state.mode);

    const [shape, setShape] = useState<"box" | "cylinder">("box");
    const [width, setWidth] = useState(1);
    const [height, setHeight] = useState(1);
    const [depth, setDepth] = useState(1);

    const handleGenerate = () => {
        // Here we ideally send a payload that tells the GenericPart component
        // to render a parameterized geometry instead of loading a GLTF URL.
        const newPart = {
            id: uuidv4(),
            baseEntityId: `parametric_${shape}_${Date.now()}`,
            type: "part" as const,
            position: [0, height / 2, 0] as [number, number, number],
            rotation: [0, 0, 0, 1] as [number, number, number, number],
            sockets: [
                { id: "top", type: "female", position: [0, height / 2, 0], rotation: [0, 0, 0, 1] },
                { id: "bottom", type: "male", position: [0, -height / 2, 0], rotation: [0, 0, 0, 1] }
            ] as SocketDefinition[]
        };

        addEntity(newPart);
    };

    if (mode !== "part") {
        return (
            <div className="p-4 text-sm text-muted-foreground text-center">
                Parametric Generation is only available in Part Builder mode.
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            <h3 className="font-semibold text-sm">Parametric Generator</h3>

            <div className="flex gap-2 text-xs">
                <button
                    onClick={() => setShape("box")}
                    className={`flex-1 py-1.5 rounded-md border text-center ${shape === "box" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}
                >
                    Box
                </button>
                <button
                    onClick={() => setShape("cylinder")}
                    className={`flex-1 py-1.5 rounded-md border text-center ${shape === "cylinder" ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"}`}
                >
                    Cylinder
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div>
                    <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                        Width (m)
                    </label>
                    <Input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(Number(e.target.value))}
                        step="0.1"
                        className="h-8 text-xs"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                        Height (m)
                    </label>
                    <Input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        step="0.1"
                        className="h-8 text-xs"
                    />
                </div>
                {shape === "box" && (
                    <div>
                        <label className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                            Depth (m)
                        </label>
                        <Input
                            type="number"
                            value={depth}
                            onChange={(e) => setDepth(Number(e.target.value))}
                            step="0.1"
                            className="h-8 text-xs"
                        />
                    </div>
                )}
            </div>

            <Button variant="primary" className="w-full text-xs h-8" onClick={handleGenerate}>
                Generate & Add to Canvas
            </Button>
        </div>
    );
}
