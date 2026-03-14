import { useDesignStore } from "@/lib/zustand";
import { v4 as uuidv4 } from "uuid";

/**
 * DesignController exposes a programmatic API to interact with the Canvas Zustand Store.
 * This can be used by an AI Assistant in the future to control the 3D scene,
 * and currently provides utility testing scripts for performance.
 */
export const DesignController = {
  /**
   * Spawns a box at a given position.
   */
  addBox: (position: [number, number, number] = [0, 0, 0], size: [number, number, number] = [1, 1, 1], color = "#ffffff") => {
    const state = useDesignStore.getState();
    const id = `ai-box-${uuidv4().substring(0, 8)}`;
    state.addEntity({
      id,
      baseEntityId: "generic-box",
      type: "part",
      layerId: "default",
      position,
      rotation: [0, 0, 0, 1] as [number, number, number, number],
      order: state.getNextOrder() || 0,
      sockets: [],
      metadata: {
        name: `AI Box ${id.substring(0,4)}`,
        dimensions: size,
        args: size, // Handle geometric fallback
        geometryType: "box",
        color
      }
    });
    return id;
  },
  
  /**
   * Spawns a cylinder at a given position.
   */
  addCylinder: (position: [number, number, number] = [0, 0, 0], size: [number, number, number] = [0.5, 0.5, 1], color = "#ffffff") => {
    const state = useDesignStore.getState();
    const id = `ai-cylinder-${uuidv4().substring(0, 8)}`;
    state.addEntity({
      id,
      baseEntityId: "generic-cylinder",
      type: "part",
      layerId: "default",
      position,
      rotation: [0, 0, 0, 1] as [number, number, number, number],
      order: state.getNextOrder() || 0,
      sockets: [],
      metadata: {
        name: `AI Cylinder ${id.substring(0,4)}`,
        dimensions: size,
        args: size,
        geometryType: "cylinder",
        color
      }
    });
    return id;
  },

  /**
   * Moves a specific entity programmatically by ID.
   */
  moveEntity: (id: string, position: [number, number, number]) => {
    const state = useDesignStore.getState();
    const entity = state.entities[id];
    if (!entity) return false;
    state.updateEntityPosition(id, position);
    return true;
  },

  /**
   * Rotates a specific entity programmatically by ID.
   */
  rotateEntity: (id: string, rotation: [number, number, number, number]) => {
    const state = useDesignStore.getState();
    const entity = state.entities[id];
    if (!entity) return false;
    state.updateEntityRotation(id, rotation);
    return true;
  },

  /**
   * Selects an entity to bind TransformControls.
   */
  selectEntity: (id: string | null) => {
    const state = useDesignStore.getState();
    state.selectEntity(id);
  },

  /**
   * Clears the entire canvas explicitly created items.
   */
  clearAll: () => {
    const state = useDesignStore.getState();
    Object.keys(state.entities).forEach(id => {
      state.removeEntity(id);
    });
    state.selectEntity(null);
  },

  /**
   * Duplicates an entity by its ID
   */
  duplicateEntity: async (id: string, canvasId?: string) => {
    const state = useDesignStore.getState();
    const sourceEntity = state.entities[id];
    if (!sourceEntity) return null;

    const clamp = (v: number) => Number(v.toFixed(3));
    const newNodeId = uuidv4();
    const newPos: [number, number, number] = [
        clamp(sourceEntity.position[0] + 0.5),
        clamp(sourceEntity.position[1]),
        clamp(sourceEntity.position[2] + 0.5)
    ];

    const clonedEntity = {
        ...sourceEntity,
        id: newNodeId,
        position: newPos,
        order: state.getNextOrder()
    };

    state.addEntity(clonedEntity);

    if (canvasId) {
        try {
            const { callGateway } = await import("@/lib/api");
            callGateway("orchestrator", {
                actionId: "createNode",
                payload: {
                    canvasId,
                    nodeId: newNodeId,
                    baseEntityId: clonedEntity.baseEntityId,
                    entityType: clonedEntity.type,
                    layerId: clonedEntity.layerId,
                    position: newPos,
                    rotation: clonedEntity.rotation.map(clamp) as [number, number, number, number] | [number, number, number],
                    metadata: clonedEntity.metadata,
                    name: `${clonedEntity.metadata?.name || 'Copia'} (Copia)`
                }
            }).catch(e => console.error("Async createNode failed", e));
        } catch (e) {
            console.error(e);
        }
    }
    return newNodeId;
  },

  /**
   * Deletes an entity by its ID
   */
  deleteEntity: async (id: string, canvasId?: string) => {
    const state = useDesignStore.getState();
    state.removeEntity(id);
    if (canvasId) {
        try {
            const { callGateway } = await import("@/lib/api");
            callGateway("orchestrator", {
                actionId: "deleteNode",
                payload: { canvasId, nodeId: id }
            }).catch(e => console.error("Async deleteNode failed", e));
        } catch (e) { console.error(e); }
    }
  },

  /**
   * Universal command execution entrypoint linking constants to Zustand states 
   */
  executeToolCommand: (toolId: string, canvasId?: string) => {
    const state = useDesignStore.getState();
    const currentUrl = typeof window !== 'undefined' ? window.location.href.split('?')[0] : '';
    switch (toolId) {
        case "sketch":
        case "part":
        case "assembly":
        case "bundle":
        case "design":
            state.setMode(toolId as "sketch" | "part" | "assembly" | "bundle" | "design" | null);
            break;
        case "edit_move":
            state.setTransformMode("translate");
            break;
        case "edit_rotate":
            state.setTransformMode("rotate");
            break;
        case "edit_snap":
            state.setTransformMode("snap");
            break;
        case "edit_duplicate":
            if (state.selectedEntityId) DesignController.duplicateEntity(state.selectedEntityId, canvasId);
            break;
        case "edit_delete":
            if (state.selectedEntityId) DesignController.deleteEntity(state.selectedEntityId, canvasId);
            break;
        case "view_2d":
        case "view_3d":
            state.triggerCameraReset();
            break;
        case "view_xr":
            import("@/components/layout/design/xrStore").then(({ xrStore }) => {
                xrStore.enterVR().catch((e: Error) => console.warn("XR Error:", e));
            });
            break;
        case "share_codesign":
            if (typeof window !== "undefined") {
                 navigator.clipboard.writeText(`Join me on STANDLO CoDesign:\n${currentUrl}`).then(() => {
                     alert("CoDesign link copied to clipboard!");
                 });
            }
            break;
        case "share_link":
            if (typeof window !== "undefined") {
                 navigator.clipboard.writeText(currentUrl).then(() => {
                     alert("Link copied to clipboard!");
                 });
            }
            break;
        case "share_linkedin":
            if (typeof window !== "undefined") {
                 window.open(`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`STANDLO | The Global Factory\n${currentUrl}`)}`, '_blank');
            }
            break;
        case "share_instagram":
            if (typeof window !== "undefined") {
                 const text = `STANDLO | The Global Factory\n${currentUrl}`;
                 navigator.clipboard.writeText(text).then(() => {
                     window.open('https://www.instagram.com/', '_blank');
                 }).catch(() => {
                     window.open('https://www.instagram.com/', '_blank');
                 });
            }
            break;
        case "general_message":
            if (typeof window !== "undefined") {
                 window.open('mailto:contact@kalex.ai?subject=STANDLO%20Message', '_blank');
            }
            break;
        case "general_support":
            if (typeof window !== "undefined") {
                 window.open('https://standlo.com/support', '_blank');
            }
            break;
    }
  }
};

// Make it available globally so we can test it directly from the DevTools console as well.
if (typeof window !== 'undefined') {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).DesignController = DesignController;
}
