import { HttpsError } from "firebase-functions/v2/https";

export async function listEntities(uid: string, entityId: string, orgId?: string, payload?: Record<string, unknown>) {
    if (!entityId) {
        throw new HttpsError("invalid-argument", "Entity ID is required for listing entities.");
    }

    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    // We can pass `ignoreSystemFilters` as an explicit `deletedAt` filter if needed, 
    // but the `firestore.run` gateway already handles default system filters.
    // However, if the client requested `ignoreSystemFilters: true`, we might need a workaround,
    // but the centralized `firestore.ts` doesn't currently support an explicit bypass
    // other than querying for *all* (e.g., deletedAt == 'any'), which Firestore doesn't support easily.
    // For now, we rely on `firestore.ts`'s standard filtering behavior.
    
    // Determine filters
    const finalFilters = payload?.filters as Array<{ field: string, op: "==" | "<" | "<=" | ">" | ">=" | "array-contains" | "in" | "array-contains-any" | "not-in" | "!=", value: unknown }> | undefined;

    if (payload?.ignoreSystemFilters === true) {
        // To bypass `isArchived == false`, add a dummy filter if we must? We can't in Firestore.
        // Actually, the new gateway standard is to NOT ignore system filters unless a specific filter is provided.
    }

    const req = createInternalRequest({
        actionId: "list",
        entityId: entityId,
        limit: payload?.limit as number,
        cursor: payload?.cursor as string,
        orderBy: payload?.orderBy as Array<{ field: string, direction: 'asc' | 'desc' }>,
        filters: finalFilters,
    }, uid, orgId);

    const result = await firestore.run(req);
    
    return {
        status: "success",
        data: result.data
    };
}

export async function readEntity(uid: string, entityId: string, docId: string) {
    if (!entityId || !docId) {
        throw new HttpsError("invalid-argument", "Entity ID and Document ID are required for reading an entity.");
    }

    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const req = createInternalRequest({
        actionId: "read",
        entityId: entityId,
        payload: { id: docId }
    }, uid, "");

    const result = await firestore.run(req);

    return {
        status: "success",
        data: result.data
    };
}
