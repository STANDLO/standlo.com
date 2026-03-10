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
    type: "part" | "assembly" | "stand" | "mesh";
    position: Vector3Tuple;
    rotation: QuaternionTuple;
    sockets: SocketDefinition[];
    isColliding?: boolean; // True if Rapier detects an overlap
    order: number; // New mounting order logic
    meshOverrides?: Record<string, {
        textureId?: string | null;
        materialId?: string | null;
        color?: string | null;
        textureUrl?: string | null;
        textureRepeat?: number[] | null;
        textureWrapS?: string | null;
        textureWrapT?: string | null;
    }>;
    metadata?: {
        geometry?: string;
        args?: number[];
        color?: string;
        roughness?: number;
        metalness?: number;
        [key: string]: unknown;
    }; // Preserving metadata for edge case primitive testing
}

export type CanvasMode = "part" | "assembly" | "stand" | null;
export type ViewMode = "2D" | "3D" | "XR" | "AR";

interface CanvasState {
    mode: CanvasMode;
    viewMode: ViewMode;
    entities: Record<string, CanvasEntity>;
    selectedEntityId: string | null;
    playbackStep: number | null; // Null means 'show all' (default editing mode). Number means simulate assembly.

    // Actions
    setMode: (mode: CanvasMode) => void;
    setViewMode: (viewMode: ViewMode) => void;

    transformMode: "translate" | "rotate" | "snap";
    setTransformMode: (mode: "translate" | "rotate" | "snap") => void;

    cameraMode: "perspective" | "orthographic" | "ortho_faces";
    setCameraMode: (mode: "perspective" | "orthographic" | "ortho_faces") => void;

    shadingMode: "shaded" | "shaded_edges" | "white_edges";
    setShadingMode: (mode: "shaded" | "shaded_edges" | "white_edges") => void;

    hoverSnap: { id: string; point: Vector3Tuple; normal: Vector3Tuple; type: 'corner' | 'midpoint' | 'origin' } | null;
    setHoverSnap: (snap: CanvasState['hoverSnap']) => void;

    snapSource: { id: string; point: Vector3Tuple; normal: Vector3Tuple; type: 'corner' | 'midpoint' | 'origin' } | null;
    setSnapSource: (snap: CanvasState['snapSource']) => void;

    addEntity: (entity: CanvasEntity) => void;
    updateEntityPosition: (id: string, position: Vector3Tuple) => void;
    updateEntityRotation: (id: string, rotation: QuaternionTuple) => void;
    setEntityCollision: (id: string, isColliding: boolean) => void;
    updateEntityMetadata: (id: string, metadata: Partial<CanvasEntity['metadata']>) => void;
    updateEntityMeshOverrides: (id: string, overrides: NonNullable<CanvasEntity['meshOverrides']>) => void;
    removeEntity: (id: string) => void;
    selectEntity: (id: string | null) => void;
    clearCanvas: () => void;
    setPlaybackStep: (step: number | null) => void;

    // Utility Getters
    getNextOrder: () => number;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
    mode: null, // default is no tool palette open
    viewMode: "3D", // default view mode
    entities: {},
    selectedEntityId: null,
    playbackStep: null,
    transformMode: "translate",
    cameraMode: "perspective",
    shadingMode: "shaded",
    hoverSnap: null,
    snapSource: null,

    setMode: (mode) => set({ mode }),
    setViewMode: (viewMode) => set({ viewMode }),
    setTransformMode: (transformMode) => set({ transformMode }),
    setCameraMode: (cameraMode) => set({ cameraMode }),
    setShadingMode: (shadingMode) => set({ shadingMode }),
    setHoverSnap: (hoverSnap) => set({ hoverSnap }),
    setSnapSource: (snapSource) => set({ snapSource }),

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

    updateEntityMetadata: (id, metadata) => set((state) => {
        const entity = state.entities[id];
        if (!entity) return state;
        const updatedEntity = {
            ...entity,
            metadata: { ...(entity.metadata || {}), ...metadata }
        };
        return {
            entities: { ...state.entities, [id]: updatedEntity }
        };
    }),

    updateEntityMeshOverrides: (id, overrides) => set((state) => {
        const entity = state.entities[id];
        if (!entity) return state;
        const updatedEntity = {
            ...entity,
            meshOverrides: { ...(entity.meshOverrides || {}), ...overrides }
        };
        return {
            entities: { ...state.entities, [id]: updatedEntity }
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

    clearCanvas: () => set({ entities: {}, selectedEntityId: null, playbackStep: null }),

    setPlaybackStep: (step) => set({ playbackStep: step }),

    getNextOrder: () => {
        const { entities } = get();
        const baseValues = Object.values(entities);
        if (baseValues.length === 0) return 0;
        return Math.max(...baseValues.map((e) => e.order || 0)) + 1;
    }
}));
