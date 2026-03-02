import { create } from "zustand";

export type Vector3Tuple = [number, number, number];
export type QuaternionTuple = [number, number, number, number];

export interface SocketDefinition {
    id: string;
    type: "male" | "female" | "neutral";
    position: Vector3Tuple;
    rotation: QuaternionTuple;
}

export interface CanvasEntity {
    id: string; // The specific instance ID on the canvas
    baseEntityId: string; // The reference ID from the catalog (Part ID or Assembly ID)
    type: "part" | "assembly";
    position: Vector3Tuple;
    rotation: QuaternionTuple;
    sockets: SocketDefinition[];
    isColliding?: boolean; // True if Rapier detects an overlap
}

export type CanvasMode = "part" | "assembly" | "stand";
export type ViewMode = "2D" | "3D" | "XR" | "AR";

interface CanvasState {
    mode: CanvasMode;
    viewMode: ViewMode;
    entities: Record<string, CanvasEntity>;
    selectedEntityId: string | null;

    // Actions
    setMode: (mode: CanvasMode) => void;
    setViewMode: (viewMode: ViewMode) => void;
    addEntity: (entity: CanvasEntity) => void;
    updateEntityPosition: (id: string, position: Vector3Tuple) => void;
    updateEntityRotation: (id: string, rotation: QuaternionTuple) => void;
    setEntityCollision: (id: string, isColliding: boolean) => void;
    removeEntity: (id: string) => void;
    selectEntity: (id: string | null) => void;
    clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
    mode: "stand", // default working mode
    viewMode: "3D", // default view mode
    entities: {},
    selectedEntityId: null,

    setMode: (mode) => set({ mode, entities: {}, selectedEntityId: null }),
    setViewMode: (viewMode) => set({ viewMode }),

    addEntity: (entity) => set((state) => ({
        entities: { ...state.entities, [entity.id]: entity }
    })),

    updateEntityPosition: (id, position) => set((state) => {
        const entity = state.entities[id];
        if (!entity) return state;
        return {
            entities: {
                ...state.entities,
                [id]: { ...entity, position }
            }
        };
    }),

    updateEntityRotation: (id, rotation) => set((state) => {
        const entity = state.entities[id];
        if (!entity) return state;
        return {
            entities: {
                ...state.entities,
                [id]: { ...entity, rotation }
            }
        };
    }),

    setEntityCollision: (id, isColliding) => set((state) => {
        const entity = state.entities[id];
        if (!entity || entity.isColliding === isColliding) return state;
        return {
            entities: {
                ...state.entities,
                [id]: { ...entity, isColliding }
            }
        };
    }),

    removeEntity: (id) => set((state) => {
        const newEntities = { ...state.entities };
        delete newEntities[id];
        return {
            entities: newEntities,
            selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId
        };
    }),

    selectEntity: (id) => set({ selectedEntityId: id }),

    clearCanvas: () => set({ entities: {}, selectedEntityId: null }),
}));
