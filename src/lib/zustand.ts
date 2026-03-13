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
    type: "part" | "assembly" | "design" | "mesh" | "bundle" | "sketch" | "wall" | "furniture";
    parentId?: string | null;
    position: Vector3Tuple;
    rotation: QuaternionTuple;
    sockets: SocketDefinition[];
    isColliding?: boolean; // True if Rapier detects an overlap
    order: number; // New mounting order logic
    layerId?: string; // Auto-routed layer destination
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
        name?: string;
        type?: string;
        color?: string; // Hex color
        roughness?: number;
        metalness?: number;
        opacity?: number;
        transparent?: boolean;
        
        // Photorealistic
        repeatX?: number;
        repeatY?: number;
        clearcoat?: number;
        clearcoatRoughness?: number;
        sheen?: number;
        sheenRoughness?: number;
        transmission?: number;
        ior?: number;

        // Textures
        albedoUrl?: string;
        normalUrl?: string;
        roughnessUrl?: string;
        
        // Physics
        friction?: number;
        restitution?: number;
        mass?: number;

        [key: string]: unknown;
    }; // Preserving metadata for edge case primitive testing
}

export type CanvasMode = "sketch" | "part" | "assembly" | "bundle" | "design" | "tools" | null;
export type ViewMode = "2D" | "3D" | "XR" | "AR";

interface DesignState {
    mode: CanvasMode;
    viewMode: ViewMode;
    entities: Record<string, CanvasEntity>;
    selectedEntityId: string | null;
    playbackStep: number | null; // Null means 'show all' (default editing mode). Number means simulate assembly.
    editPassword: string | null;

    // Actions
    setEditPassword: (password: string | null) => void;
    setMode: (mode: CanvasMode) => void;
    setViewMode: (viewMode: ViewMode) => void;

    transformMode: "translate" | "rotate" | "snap" | null;
    setTransformMode: (mode: "translate" | "rotate" | "snap" | null) => void;

    isDragging: boolean;
    setIsDragging: (isDragging: boolean) => void;

    cameraMode: "perspective" | "orthographic" | "ortho_faces";
    setCameraMode: (mode: "perspective" | "orthographic" | "ortho_faces") => void;

    cameraResetTrigger: number;
    triggerCameraReset: () => void;

    shadingMode: "shaded" | "shaded_edges" | "white_edges";
    setShadingMode: (mode: "shaded" | "shaded_edges" | "white_edges") => void;

    activeLayer: string | null;
    setActiveLayer: (layer: string | null) => void;

    tutorialStep: number | null;
    setTutorialStep: (step: number | null) => void;

    hoverSnap: { id: string; point: Vector3Tuple; normal: Vector3Tuple; type: 'corner' | 'midpoint' | 'origin' } | null;
    setHoverSnap: (snap: DesignState['hoverSnap']) => void;

    snapSource: { id: string; point: Vector3Tuple; normal: Vector3Tuple; type: 'corner' | 'midpoint' | 'origin' } | null;
    setSnapSource: (snap: DesignState['snapSource']) => void;

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

    // Data Dictionaries
    materialsRegistry: Record<string, unknown>[];
    texturesRegistry: Record<string, unknown>[];
    setDictionaries: (materials: Record<string, unknown>[], textures: Record<string, unknown>[]) => void;
}

export const useDesignStore = create<DesignState>((set, get) => ({
    mode: null, // default is no tool palette open
    viewMode: "3D", // default view mode
    entities: {},
    selectedEntityId: null,
    playbackStep: null,
    transformMode: null,
    isDragging: false,
    cameraMode: "perspective",
    cameraResetTrigger: 0,
    shadingMode: "shaded",
    activeLayer: null,
    tutorialStep: null,
    hoverSnap: null,
    snapSource: null,
    editPassword: null,

    materialsRegistry: [],
    texturesRegistry: [],

    setDictionaries: (materials, textures) => set({ materialsRegistry: materials, texturesRegistry: textures }),

    setEditPassword: (password) => set({ editPassword: password }),
    setMode: (mode) => set({ mode }),
    setViewMode: (viewMode) => set({ viewMode }),
    setTransformMode: (transformMode) => set({ transformMode }),
    setIsDragging: (isDragging) => set({ isDragging }),
    setCameraMode: (cameraMode) => set({ cameraMode }),
    triggerCameraReset: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),
    setShadingMode: (shadingMode) => set({ shadingMode }),
    setActiveLayer: (activeLayer) => set({ activeLayer }),
    setTutorialStep: (tutorialStep) => set({ tutorialStep }),
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
