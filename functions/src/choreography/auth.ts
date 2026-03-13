import { AuthEvent } from "../schemas/auth";

import { GatewayFilter } from "../types";

/**
 * Records an authentication event in the Firestore "auth" collection.
 * Features a fast-bounce deduplication check (10 seconds) for the same event type and sessionId/uid.
 */
export async function recordAuthEvent(event: AuthEvent): Promise<void> {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    // Deduplication check window: 10 seconds ago
    const tenSecondsAgo = new Date(Date.now() - 10000);

    // Build the query using gateway filters
    const filters: GatewayFilter[] = [
        { field: "type", op: "==", value: event.type },
        { field: "createdAt", op: ">=", value: tenSecondsAgo }
    ];

    if (event.sessionId) {
        filters.push({ field: "sessionId", op: "==", value: event.sessionId });
    } else {
        filters.push({ field: "uid", op: "==", value: event.uid });
    }

    try {
        const queryReq = createInternalRequest({
            actionId: "list",
            entityId: "auths",
            payload: { filters, limit: 1 }
        }, event.uid || "system");

        const recentEventsRes = await firestore.run(queryReq) as { data: unknown[] };

        if (recentEventsRes.data && recentEventsRes.data.length > 0) {
            console.log(`[AuthChoreography] Deduplicated ${event.type} event for uid: ${event.uid}`);
            return; // Skip writing the event
        }

        // Write the event
        const createReq = createInternalRequest({
            actionId: "create",
            entityId: "auths",
            payload: {
                ...event,
                active: true,
                version: 1,
                code: `AUTH-${Date.now().toString().slice(-6)}`,
            }
        }, event.uid || "system");

        await firestore.run(createReq);

        console.log(`[AuthChoreography] Logged ${event.type} event for uid: ${event.uid} (Session: ${event.sessionId})`);
    } catch (error) {
        console.error(`[AuthChoreography] Error recording auth event:`, error);
        // We do not throw to prevent blocking the Orchestrator
    }
}
