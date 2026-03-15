"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@heroui/react";
import { set, createStore } from "idb-keyval";
import { Translations } from "@schemas/translation";

export function DcodeSync() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const moduleId = params?.module as string;
  const actionId = params?.action as string;
  const entityId = params?.id as string;

  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");

  const shouldSync = moduleId === "design" && (actionId === "read" || actionId === "write") && entityId && entityId !== "default";
  
  useEffect(() => {
    if (!shouldSync) return;

    // A flag to ensure we only sync once per entity load
    const syncLockKey = `dcode_sync_lock_${entityId}`;
    if (sessionStorage.getItem(syncLockKey)) return;

    const performSync = async () => {
      setIsSyncing(true);
      setProgress(10);
      setStatusText(Translations("system", "messages", "syncing_start", locale) || "Initilializing DCODE Sync...");

      try {
        const response = await fetch("/api/dcoder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionId: "list",
            moduleId: "design",
            entityId,
            async: false,
            payload: {}
          })
        });

        if (!response.ok) {
          throw new Error(`DCODE Gateway responded with ${response.status}`);
        }

        setProgress(50);
        setStatusText(Translations("system", "messages", "syncing_download", locale) || "Downloading Deep Entity Graph...");
        
        const { data } = await response.json();

        setProgress(70);
        setStatusText(Translations("system", "messages", "syncing_idb", locale) || "Hydrating Local IndexedDB...");

        // Save into IndexedDB using idb-keyval on "preferences" store of STANDLO db
        const customStore = createStore("STANDLO", "preferences");
        
        // As requested: storing the whole design mass-dump into IndexedDB
        await set(`design_${entityId}`, data, customStore);

        setProgress(100);
        setStatusText(Translations("system", "messages", "syncing_complete", locale) || "Hydration Complete. Resuming Engine.");

        sessionStorage.setItem(syncLockKey, "true");
        
        // Tiny artificial delay to let user see 100%
        setTimeout(() => setIsSyncing(false), 800);

      } catch (error) {
        console.error("[DcodeSync] Error:", error);
        setStatusText(Translations("system", "messages", "syncing_error", locale) || "Sync failed. Please refresh.");
        // We don't hide the overlay on error so the user knows something broke, or we can auto-hide.
      }
    };

    performSync();

  }, [shouldSync, entityId, locale]);

  if (!shouldSync || !isSyncing) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <Card className="w-full max-w-md p-6 shadow-2xl border border-default-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <div className="text-xl font-bold mb-1">
            {Translations("system", "modules", moduleId, locale)}
          </div>
          <div className="text-sm text-default-500 mb-6">
            {statusText}
          </div>
          <div className="w-full bg-default-200 rounded-full h-2.5 max-w-md">
            <div className="bg-primary h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="mt-2 text-xs font-semibold text-primary">{Math.round(progress)}%</div>
        </div>
      </Card>
    </div>
  );
}
