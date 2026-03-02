"use client";

import { useState } from "react";
import { FormList } from "@/components/forms/FormList";
import { Button } from "@/components/ui/Button";

const ENTITIES = ["canvasMaterials", "canvasTextures"];

export default function CanvasMaterialsAdminPage() {
    const [selectedEntity, setSelectedEntity] = useState("canvasMaterials");
    const [active, setActive] = useState(false);

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <header className="border-b border-border pb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <span className="text-blue-600 dark:text-blue-400 mr-2">Materials & Textures</span> Manager
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage the 3D materials (PBR) and textures (albedo/normal/roughness maps) for the Canvas 3D Editor.
                    These resources are loaded by the Three.js engine and utilize a dual Light/Dark mode structure.
                </p>
                <div className="flex space-x-4 mt-6">
                    <div className="flex-1 max-w-sm">
                        <label className="text-sm font-semibold mb-2 block">Target Entity</label>
                        <select
                            className="w-full bg-card border border-border rounded p-2"
                            value={selectedEntity}
                            onChange={(e) => { setSelectedEntity(e.target.value); setActive(false); }}
                        >
                            {ENTITIES.map(e => <option key={e} value={e}>{e === "canvasMaterials" ? "Materials (Schemas)" : "Textures (Maps/Colors)"}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="primary" onClick={() => setActive(true)}>Load Entity</Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden relative">
                {!active ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground font-bold">
                        Select an entity and click "Load Entity".
                    </div>
                ) : (
                    <div className="p-6 h-full overflow-y-auto">
                        <h2 className="font-bold text-xl mb-6 text-primary">Active Target: /{selectedEntity}</h2>
                        <FormList
                            entityId={selectedEntity}
                            roleId="admin"
                            columns={[
                                { key: "id", label: "ID" },
                                { key: "name", label: "Name" },
                                // Dynamically checking which columns to show based on entity
                                ...(selectedEntity === "canvasMaterials" ? [
                                    { key: "roughness", label: "Roughness" },
                                    { key: "metalness", label: "Metalness" }
                                ] : [
                                    { key: "type", label: "Type" },
                                    { key: "valueLight", label: "Light Value" },
                                    { key: "valueDark", label: "Dark Value" }
                                ]),
                                { key: "createdAt", label: "Creazione" }
                            ]}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
