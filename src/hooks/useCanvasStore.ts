import { create } from "zustand";
import { getBounds, checkAABBCollision } from "@/lib/collisions";

export interface CanvasTransform {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
}

export interface CanvasNode {
    id: string; // The backend objectId
    partId: string; // The catalog part it references
    transform: CanvasTransform;
    materialVariant?: string;
    locked?: boolean;
}

export interface InstancedBatch {
    hash: string; 
    partId: string;
    materialVariant: string;
    nodeIds: string[]; // List of nodes belonging to this batch instance
}

export interface CanvasState {
    // Structural Data
    designId: string | null;
    nodes: Record<string, CanvasNode>; // Dictionary for O(1) lookups
    batchedInstances: Record<string, InstancedBatch>; // Grouped for single-draw-call InstancedMesh GPU rendering
    loaded: boolean;
    
    // Engine Settings
    snappingEnabled: boolean;
    snappingGridSize: number;
    showXRControllers: boolean;

    // Actions
    hydrate: (designId: string, payloadNodes: CanvasNode[]) => void;
    updateNodeTransform: (id: string, transform: Partial<CanvasTransform>) => void;
    addNode: (node: CanvasNode) => void;
    removeNode: (id: string) => void;
    clear: () => void;

    // Computational Queries
    getCollisions: (nodeId: string, customTransform?: Partial<CanvasTransform>) => string[];
}

/**
 * useCanvasStore
 * Global 0-latency engine for the 3D Editor (React Three Fiber).
 * All UI drags mutated here are synced to Backend via the `useDcode` async dispatcher.
 */
/**
 * Helper to compute the grouping hash for GPU instancing
 */
const getBatchHash = (partId: string, materialVariant?: string) => `${partId}__${materialVariant || "default"}`;

/**
 * Recomputes entirely the batched instances from scratch (Useful for mass hydration)
 */
const computeBatches = (nodes: Record<string, CanvasNode>) => {
    const batches: Record<string, InstancedBatch> = {};
    Object.values(nodes).forEach(node => {
        const hash = getBatchHash(node.partId, node.materialVariant);
        if (!batches[hash]) {
            batches[hash] = { hash, partId: node.partId, materialVariant: node.materialVariant || "default", nodeIds: [] };
        }
        batches[hash].nodeIds.push(node.id);
    });
    return batches;
};

/**
 * Incremental batch addition for 0-latency operations
 */
const addToBatch = (batches: Record<string, InstancedBatch>, node: CanvasNode) => {
    const hash = getBatchHash(node.partId, node.materialVariant);
    if (!batches[hash]) {
        batches[hash] = { hash, partId: node.partId, materialVariant: node.materialVariant || "default", nodeIds: [] };
    }
    if (!batches[hash].nodeIds.includes(node.id)) {
        batches[hash].nodeIds.push(node.id);
    }
};

/**
 * Incremental batch removal for 0-latency operations
 */
const removeFromBatch = (batches: Record<string, InstancedBatch>, node: CanvasNode) => {
    const hash = getBatchHash(node.partId, node.materialVariant);
    if (batches[hash]) {
        batches[hash].nodeIds = batches[hash].nodeIds.filter(id => id !== node.id);
        if (batches[hash].nodeIds.length === 0) {
            delete batches[hash];
        }
    }
};

export const useCanvasStore = create<CanvasState>((set) => ({
    designId: null,
    nodes: {},
    batchedInstances: {},
    loaded: false,
    
    snappingEnabled: true,
    snappingGridSize: 0.1, // 10cm default snap
    showXRControllers: true,

    hydrate: (designId, payloadNodes) => set(() => {
        const nodesDict: Record<string, CanvasNode> = {};
        payloadNodes.forEach(n => nodesDict[n.id] = n);
        return { 
            designId, 
            nodes: nodesDict, 
            batchedInstances: computeBatches(nodesDict),
            loaded: true 
        };
    }),

    updateNodeTransform: (id, newTransform) => set((state) => {
        const node = state.nodes[id];
        if (!node) return state;
        
        // Note: transform updates do NOT change the batch grouping (partId/material are immutable in this action)
        return {
            nodes: {
                ...state.nodes,
                [id]: {
                    ...node,
                    transform: {
                        ...node.transform,
                        ...newTransform
                    }
                }
            }
        };
    }),

    addNode: (node) => set((state) => {
        const newNodes = { ...state.nodes, [node.id]: node };
        const newBatches = { ...state.batchedInstances };
        // Deep clone the array we modify to avoid mutating standard React state refs directly
        const hash = getBatchHash(node.partId, node.materialVariant);
        if (newBatches[hash]) newBatches[hash] = { ...newBatches[hash], nodeIds: [...newBatches[hash].nodeIds] };
        
        addToBatch(newBatches, node);
        return { nodes: newNodes, batchedInstances: newBatches };
    }),

    removeNode: (id) => set((state) => {
        const node = state.nodes[id];
        if (!node) return state;

        const newNodes = { ...state.nodes };
        delete newNodes[id];

        const newBatches = { ...state.batchedInstances };
        const hash = getBatchHash(node.partId, node.materialVariant);
        if (newBatches[hash]) newBatches[hash] = { ...newBatches[hash], nodeIds: [...newBatches[hash].nodeIds] };
        
        removeFromBatch(newBatches, node);
        
        return { nodes: newNodes, batchedInstances: newBatches };
    }),

    getCollisions: (nodeId, customTransform) => {
        const state = set as unknown as { getState: () => CanvasState };
        const { nodes } = state.getState();
        const node = nodes[nodeId];
        
        if (!node) return [];

        const transform = customTransform ? { ...node.transform, ...customTransform } : node.transform;
        const myBounds = getBounds(transform.position, transform.scale);
        
        const collisions: string[] = [];
        
        for (const otherId in nodes) {
            if (otherId === nodeId) continue;
            const otherTransform = nodes[otherId].transform;
            const otherBounds = getBounds(otherTransform.position, otherTransform.scale);
            
            if (checkAABBCollision(myBounds, otherBounds)) {
                collisions.push(otherId);
            }
        }
        
        return collisions;
    },

    clear: () => set({ designId: null, nodes: {}, batchedInstances: {}, loaded: false })
}));
