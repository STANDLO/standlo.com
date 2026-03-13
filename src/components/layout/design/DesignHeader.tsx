"use client";

import { Save, Undo, Redo, Download, Cuboid } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DesignHeaderViewer } from "./DesignHeaderViewer";
import { DesignHeaderAdd } from "./DesignHeaderAdd";
import { DesignHeaderLayers } from "./DesignHeaderLayers";
import { AssemblyTimeline } from "./AssemblyTimeline";
import { useDesignStore } from "./store";

interface DesignHeaderProps {
    roleId: string;
    entityId: string | null;
    onEnterXR: (type: "VR" | "AR") => void;
    onExport: () => void;
}

export function DesignHeader({ roleId, entityId, onEnterXR, onExport }: DesignHeaderProps) {
    const entities = useDesignStore((state) => state.entities);

    const handleSave = async () => {
        if (!entityId) return;

        let targetSchema = "mesh";
        if (entityId.startsWith("PAR-")) targetSchema = "part";
        else if (entityId.startsWith("ASS-")) targetSchema = "assembly";
        else if (entityId.startsWith("DES-")) targetSchema = "design";



        try {
            const { auth } = await import("@/core/firebase");
            const currentUser = auth.currentUser;
            if (!currentUser) return;
            
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

            const { callGateway } = await import("@/lib/api");

            // Fire and forget (no await blocking UI)
            callGateway("orchestrator", {
                actionId: "save_design",
                entityId: targetSchema,
                payload: {
                    id: entityId,
                    ...payload
                }
            }).then(() => {

            }).catch(e => {
                console.error("Async background save failed", e);
            });

        } catch (e) {
            console.error("Save pipeline error", e);
        }
    };

    return (
        <header className="ui-design-header">
            {/* Left Box */}
            <div className="ui-design-header-left">
                <div className="ui-design-header-icon-box">
                    <Cuboid className="ui-design-header-icon" />
                </div>
                <div>
                    <h1 className="ui-design-header-title">Design System</h1>
                    <p className="ui-design-header-subtitle">Temporary Information Modeling</p>
                </div>
            </div>

            {/* Right Box: Mode Toolbar, DesignHeaderViewer, Actions */}
            <div className="ui-design-header-right">
                <DesignHeaderAdd roleId={roleId} entityId={entityId} />
                <DesignHeaderLayers />

                <AssemblyTimeline />

                <div className="ui-design-separator" />

                {/* Using the newly created Viewer component */}
                <DesignHeaderViewer onEnterXR={onEnterXR} />

                <Button variant="default" size="icon" className="ui-design-action-btn">
                    <Undo className="ui-design-action-icon" />
                </Button>
                <Button variant="default" size="icon" className="ui-design-action-btn">
                    <Redo className="ui-design-action-icon" />
                </Button>
                <div className="ui-design-separator" />
                <Button variant="outline" size="sm" className="ui-design-export-btn" onClick={onExport}>
                    <Download className="ui-design-export-icon" />
                    Export
                </Button>
                <Button variant="default" size="sm" className="ui-design-save-btn" onClick={handleSave}>
                    <Save className="ui-design-save-icon" />
                    Save
                </Button>
            </div>
        </header>
    );
}
