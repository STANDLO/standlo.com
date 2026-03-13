import { useDesignStore } from "@/components/layout/design/store";
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
  }
};

// Make it available globally so we can test it directly from the DevTools console as well.
if (typeof window !== 'undefined') {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).DesignController = DesignController;
}
