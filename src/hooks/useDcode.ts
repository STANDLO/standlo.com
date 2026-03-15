import { useCallback } from "react";
import { useRouter, useParams } from "next/navigation";

export function useDcode() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const dispatch = useCallback(async (command: string) => {
    /**
     * DCODE Regex Parser:
     * Format: @module #action {payload} &
     * - @module: target entity/schema group
     * - #action: internal CRUD or EXECUTE action
     * - {payload}: optional JSON string
     * - &: optional modifier indicating UI Sync (routes to form)
     */
    const match = command.match(/^@([a-zA-Z0-9_]+)\s+#([a-zA-Z0-9_]+)\s*(?:(&)\s*)?(\{.*\}|\[.*\])?\s*(?:(&)\s*)?$/);
    
    if (!match) {
        console.error("[DCODE Engine] Invalid command syntax. Expected format: @module #action {payload} &");
        return;
    }

    const [, module, action, preAmpersand, payloadStr, postAmpersand] = match;
    const isSyncUI = !!preAmpersand || !!postAmpersand;
    
    let payload: Record<string, any> = {};
    if (payloadStr) {
      try {
        payload = JSON.parse(payloadStr);
      } catch (e) {
        console.error("[DCODE Engine] Invalid JSON payload", e);
      }
    }

    if (isSyncUI) {
       const entityId = payload.id || "new";
       // Azione Sync (&) -> Mostra l'interfaccia Form
       router.push(`/${locale}/${module}/${action}/${entityId}`);
       return;
    }

    // Azione Async -> Trasforma Zustand a latenza 0 e spara in background
    // TODO: Mutate Zustand here locally for latency-0 updates
    console.log(`[DCODE Engine] Async mutation started: ${module}/${action}`);

    try {
      const response = await fetch("/api/dcoder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId: action,
          moduleId: module,
          entityId: payload.id,
          async: true,
          payload
        })
      });
      
      if (!response.ok) {
        throw new Error(`Execution failed with status ${response.status}`);
      }
      
      const result = await response.json();
      console.log("[DCODE Engine] Async execution successful:", result);
    } catch (err) {
      console.error("[DCODE Engine] Async execution error:", err);
      // TODO: Revert Zustand state on error
    }

  }, [router, locale]);

  return { dispatch };
}
