import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GatewayRequest } from "../types";

export const firestore = onCall({
    region: "europe-west4",
    enforceAppCheck: true,
    consumeAppCheckToken: false,
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated to access Firestore gateway.");
    }

    const data = request.data as GatewayRequest;
    const { correlationId, orgId, userId, roleId, entityId, actionId, payload } = data;

    console.log(`[Firestore][${correlationId || 'no-corr-id'}] Request: ${actionId} on Entity: ${entityId} for User: ${request.auth.uid}`);
    console.log(`[Firestore] Details: orgId=${orgId}, roleId=${roleId}, userId=${userId}, payload=${!!payload}`);

    // TODO: Verify Rate Limiting / Circuit Breaker for User

    // TODO: Apply Hierarchical Caching Logic (orgId / roleId / userId)

    // TODO: Execute the actual CRUD (Admin SDK bypasses security rules)

    return {
        status: "success",
        data: {}, // Return requested documents
        actionId,
    };
});
