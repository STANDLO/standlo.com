"use client";

import { useEffect } from "react";
import { get, createStore } from "idb-keyval";
import { useCanvasStore, CanvasNode, CanvasTransform } from "@/hooks/useCanvasStore";

export interface DesignSyncProps {
  designId: string;
  onComplete: () => void;
  onError?: (err: Error) => void;
}

/**
 * Headless Component orchestrating the DCODE Local-First Sync.
 * Creates an isolated IndexedDB `STANDLO.[designId]` and hydrates Zustand.
 */
export default function DesignSync({ designId, onComplete, onError }: DesignSyncProps) {
  useEffect(() => {
    let mounted = true;

    async function executeSync() {
      try {
        console.log(`[DesignSync] Initializing local environment for Design: ${designId}`);
        
        // 1. Fetch from DCODE Mass Extraction (IndexedDB)
        const customStore = createStore("STANDLO", "preferences");
        const storedData = await get(`design_${designId}`, customStore);

        if (!storedData) {
          throw new Error(`[DesignSync] Missing local payload for design_${designId}. DcodeSync might have failed.`);
        }

        // 2. Parse Objects into CanvasNodes
        // DCODE MUST map objects with identical UUIDs 
        const rawObjects = storedData.objects || [];
        
        const payloadNodes: CanvasNode[] = rawObjects.map((obj: any) => ({
             id: obj.id,
             partId: obj.partId || "unknown_part",
             transform: obj.transform as CanvasTransform || { position: [0,0,0], rotation: [0,0,0], scale: [1,1,1] },
             materialVariant: obj.materialVariant,
             locked: obj.locked || false,
        }));

        console.log(`[DesignSync] Loaded ${payloadNodes.length} objects from IndexedDB`);

        // 3. Hydrate Zustand (Zustand ID = Firestore UUID)
        useCanvasStore.getState().hydrate(designId, payloadNodes);
             
        if (mounted) {
           // Provide a slight artificial delay for UX smoothness simulating actual parsing/geometry allocation
           setTimeout(() => onComplete(), 400);
        }

      } catch (error: any) {
        console.error(`[DesignSync] Fatal Error hydrating Design ${designId}`, error);
        if (onError) onError(error);
      }
    }

    executeSync();

    return () => {
      mounted = false;
    };
  }, [designId, onComplete, onError]);

  // Headless component, renders no visual UI
  return null;
}
