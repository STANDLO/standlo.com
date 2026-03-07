"use client";

import { Save, Undo, Redo, Download, Cuboid } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CanvasHeaderViewer } from "./CanvasHeaderViewer";
import { CanvasHeaderAdd } from "./CanvasHeaderAdd";
import { AssemblyTimeline } from "./AssemblyTimeline";
import { useCanvasStore } from "./store";

interface CanvasHeaderProps {
    roleId: string;
    entityId: string | null;
    onEnterXR: (type: "VR" | "AR") => void;
    onExport: () => void;
}

export function CanvasHeader({ roleId, entityId, onEnterXR, onExport }: CanvasHeaderProps) {
    const entities = useCanvasStore((state) => state.entities);

    const handleSave = async () => {
        if (!entityId) return;

        let targetSchema = "mesh";
        if (entityId.startsWith("PAR-")) targetSchema = "part";
        else if (entityId.startsWith("ASS-")) targetSchema = "assembly";
        else if (entityId.startsWith("STA-")) targetSchema = "stand";

        console.log("Async saving started...", { targetSchema, entityId });

        try {
            const { auth } = await import("@/core/firebase");
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            const idToken = await currentUser.getIdToken();

            let payload: Record<string, unknown> = {};

            if (targetSchema === "mesh") {
                const meshEntity = entities[entityId];
                if (meshEntity) {
                    payload = {
                        dimensions: meshEntity.metadata?.dimensions,
                        materialId: meshEntity.metadata?.materialId || null,
                        textureId: meshEntity.metadata?.textureId || null
                    };
                }
            } else {
                payload = {
                    objects: Object.values(entities).map(ent => ({
                        id: ent.id,
                        baseEntityId: ent.baseEntityId,
                        position: ent.position,
                        rotation: ent.rotation,
                        type: ent.type,
                        order: ent.order,
                        meshOverrides: ent.meshOverrides || {}
                    }))
                };
            }

            // Fire and forget (no await blocking UI)
            fetch(`/api/gateway?target=choreography`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    actionId: "save_canvas",
                    entityId: targetSchema,
                    payload: {
                        id: entityId,
                        ...payload
                    }
                })
            }).then(res => {
                if (!res.ok) console.error("Async background save failed", res);
                else console.log("Async save successful!");
            }).catch(e => console.error("Async save network error", e));

        } catch (e) {
            console.error("Save pipeline error", e);
        }
    };

    return (
        <header className="ui-canvas-header">
            {/* Left Box */}
            <div className="ui-canvas-header-left">
                <div className="ui-canvas-header-icon-box">
                    <Cuboid className="ui-canvas-header-icon" />
                </div>
                <div>
                    <h1 className="ui-canvas-header-title">Design System</h1>
                    <p className="ui-canvas-header-subtitle">Temporary Information Modeling</p>
                </div>
            </div>

            {/* Right Box: Mode Toolbar, CanvasHeaderViewer, Actions */}
            <div className="ui-canvas-header-right">
                <CanvasHeaderAdd roleId={roleId} entityId={entityId} />

                <AssemblyTimeline />

                <div className="ui-canvas-separator" />

                {/* Using the newly created Viewer component */}
                <CanvasHeaderViewer onEnterXR={onEnterXR} />

                <Button variant="secondary" size="icon" className="ui-canvas-action-btn">
                    <Undo className="ui-canvas-action-icon" />
                </Button>
                <Button variant="secondary" size="icon" className="ui-canvas-action-btn">
                    <Redo className="ui-canvas-action-icon" />
                </Button>
                <div className="ui-canvas-separator" />
                <Button variant="outline" size="sm" className="ui-canvas-export-btn" onClick={onExport}>
                    <Download className="ui-canvas-export-icon" />
                    Export
                </Button>
                <Button variant="primary" size="sm" className="ui-canvas-save-btn" onClick={handleSave}>
                    <Save className="ui-canvas-save-icon" />
                    Save
                </Button>
            </div>
        </header>
    );
}
