import { functions } from "@/core/firebase";
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
 * It uses httpsCallable to securely call Cloud Functions without raw fetch operations.
 * 
 * @param target The target gateway to call (e.g. "orchestrator", "choreography", "canvas")
 * @param request The request containing actionId, entityId, and payload
 * @returns The inner un-wrapped response from the function
 */
export async function callGateway<TRes = unknown>(
    target: "orchestrator" | "choreography" | "canvas",
    request: GatewayRequest<unknown>
): Promise<TRes> {
    try {
        const callableFn = httpsCallable<GatewayRequest<unknown>, { data: TRes; result?: TRes; [key: string]: unknown }>(functions, target);
        const res = await callableFn(request);
        
        // Extract the result securely handling different return shapes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const jsonRes = res.data as any;
        return jsonRes.result || jsonRes.data || jsonRes;
    } catch (error) {
        console.error(`[API Client] Error calling gateway ${target}:`, error);
        throw error;
    }
}
