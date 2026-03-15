"use client";

import { useEffect, useRef } from "react";
import type { SyncPayload } from "@schemas/sync";

export function SyncProvider({ payload }: { payload: SyncPayload }) {
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;

    const request = indexedDB.open("STANDLO", 2);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      const stores = Object.keys(payload);
      
      stores.forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id" });
        }
      });

      // Ensure preferences store exists for idb-keyval (without keyPath)
      if (!db.objectStoreNames.contains("preferences")) {
        db.createObjectStore("preferences");
      }
    };

    request.onsuccess = (event: any) => {
      const db = event.target.result;

      // 1. Check current DB version
      try {
        const tx = db.transaction("system", "readonly");
        const store = tx.objectStore("system");
        const getRequest = store.get("version");

        getRequest.onsuccess = () => {
          const storedVersion = getRequest.result?.value;
          const currentVersion = payload.system.find(s => s.id === "version")?.value;

          if (storedVersion === currentVersion) {
            console.log(`[SYNC] Dictionaries up-to-date (v${currentVersion}). Skipping sync.`);
            return;
          }

          console.log(`[SYNC] Version mismatch! Stored: ${storedVersion}, Current: ${currentVersion}. Wiping and rebuilding...`);
          performResync(db);
        };
        
        getRequest.onerror = () => {
             console.log("[SYNC] Could not read system version. Forcing rebuild...");
             performResync(db);
        }

      } catch (e) {
        // "system" store might not exist or be empty yet
        console.log("[SYNC] Fresh install detected. Bootstrapping...");
        performResync(db);
      }
    };

    request.onerror = (event: any) => {
      console.error("[SYNC] Failed to open IndexedDB:", event.target.error);
    };

    function performResync(db: IDBDatabase) {
      Object.entries(payload).forEach(([storeName, rawItems]) => {
        const items = rawItems as any[];
        try {
          const tx = db.transaction(storeName, "readwrite");
          const store = tx.objectStore(storeName);
          
          // Clear old data to prevent stale orphans
          store.clear();

          items.forEach((item: any) => {
            store.put(item);
          });
          
          tx.oncomplete = () => {
             console.log(`[SYNC] Successfully synced ${items.length} records into '${storeName}' IndexedDB store`);
          };
        } catch (error) {
          console.error(`[SYNC] Error syncing store ${storeName}:`, error);
        }
      });
    }

  }, [payload]);

  return null;
}
