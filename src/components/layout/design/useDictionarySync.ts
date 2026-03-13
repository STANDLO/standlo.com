"use client";

import { useEffect, useState } from "react";
import { get, set } from "idb-keyval";
import { useDesignStore } from "./store";
import canvasMaterialsFallback from "@/core/constants/design_materials.json";
import canvasTexturesFallback from "@/core/constants/design_textures.json";

interface CachedDictionaries {
  version?: string;
  materials: Record<string, unknown>[];
  textures: Record<string, unknown>[];
}

export function useDictionarySync() {
  const setDictionaries = useDesignStore((state) => state.setDictionaries);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function syncDictionaries() {
      try {
        // Try locally first for instant visual hydration
        const cached = await get<CachedDictionaries>("canvas_dictionaries");
        if (cached && cached.materials && cached.textures && mounted) {
          setDictionaries(cached.materials, cached.textures);
          setIsReady(true);
        }

        // Fetch from API in background
        const response = await fetch("/api/canvas/dictionaries");
        if (!response.ok) throw new Error("Failed to fetch dictionaries");
        
        const data = await response.json();
        if (data.status === "success" && data.dictionaries) {
          // If no cache, missing version, or version mismatch
          if (!cached || cached.version !== data.version) {
            console.log(`[Canvas] Dictionary cache updated to version: ${data.version}`);
            await set("canvas_dictionaries", {
              version: data.version,
              materials: data.dictionaries.materials,
              textures: data.dictionaries.textures
            });
            if (mounted) {
              setDictionaries(data.dictionaries.materials, data.dictionaries.textures);
              setIsReady(true);
            }
          }
        }
      } catch (err) {
        console.warn("Dictionary sync failed, falling back to static constants:", err);
        // Fallback to static constants
        if (mounted && !isReady) {
          setDictionaries(canvasMaterialsFallback, canvasTexturesFallback);
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setIsReady(true);
        }
      }
    }

    syncDictionaries();

    return () => {
      mounted = false;
    };
  }, [setDictionaries, isReady]);

  return { isReady, error };
}
