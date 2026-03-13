import { functions, auth } from "@/core/firebase";
import { httpsCallable } from "firebase/functions";

export type BaseApiPayload = Record<string, unknown>;

export interface GatewayRequest<T = BaseApiPayload> {
    actionId: string;
    entityId?: string;
    payload?: T;
    // Allow variable properties, e.g. orgId and roleId for orchestrator contexts
    [key: string]: unknown;
}

/**
 * Centrally managed API client for Firebase Cloud Functions.
 * Handles App Check, local/production environment routing, and authentication via Firebase SDK.
 * 
 * =========================================================================
 * 🚨 CRITICAL RULE: ALL API CALLS MUST GO THROUGH `orchestrator` 🚨
 * =========================================================================
 * Do NOT bypass the Orchestrator. Do NOT call `choreography` or `canvas` 
 * directly from the frontend. The Orchestrator is the single entry point
 * for all actions. It will then route to the correct `functions/src/orchestrator/...` 
 * which may in turn trigger `choreography` for fire-and-forget background tasks.
 * 
 * @param target The target gateway to call (MUST ALWAYS BE "orchestrator")
 * @param request The request containing actionId, entityId, and payload
 * @returns The inner un-wrapped response from the function
 */
export async function callGateway<TRes = unknown>(
    target: "orchestrator",
    request: GatewayRequest<unknown>
): Promise<TRes> {
    try {
        const enrichedRequest = { ...request };

        // Se non c'è un utente loggato, iniettiamo esplicitamente le credenziali "guest"
        if (!auth.currentUser) {
            enrichedRequest.orgId = enrichedRequest.orgId || "guest";
            enrichedRequest.roleId = enrichedRequest.roleId || "guest";
        }

        const callable = httpsCallable<GatewayRequest<unknown>, unknown>(functions, target);
        const result = await callable(enrichedRequest);

        const data = result.data;
        // Alcune vecchie function potrebbero ancora restituire un oggetto wrapped { result: ... }
        if (data && typeof data === 'object' && 'result' in data) {
            return (data as Record<string, unknown>).result as TRes;
        }
        return data as TRes;
    } catch (error) {
        console.error(`[API Client] Error calling gateway ${target}:`, error);
        throw error;
    }
}
