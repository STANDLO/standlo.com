import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GatewayRequest } from "../types";
import { onboardOrganization } from "../orchestrator/organization";

export const orchestrator = onCall({
    region: "europe-west4",
    enforceAppCheck: true,
    consumeAppCheckToken: false,
}, async (request) => {
    // 1. Mandatory Auth check
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated to access Orchestrator.");
    }

    const data = request.data as GatewayRequest;
    const { correlationId, idempotencyKey, orgId, userId, roleId, entityId, actionId, payload } = data;

    // Log the initiation of the workflow tracing it with correlationId
    console.log(`[Orchestrator][${correlationId || 'no-corr-id'}] Action: ${actionId} on Entity: ${entityId} started by User: ${request.auth.uid}`);
    console.log(`[Orchestrator] Details: orgId=${orgId}, userId=${userId}, roleId=${roleId}, idempotencyKey=${idempotencyKey}, payload=${!!payload}`);

    // TODO: Verify idempotencyKey against Firestore 'idempotency_locks' to prevent duplicated logic execution

    // --- ROUTER START ---
    if (actionId === "onboard_organization") {
        if (!payload) {
            throw new HttpsError("invalid-argument", "Payload is required for onboarding.");
        }
        return onboardOrganization(request.auth.uid, payload as Record<string, unknown>);
    }
    // --- ROUTER END ---

    return {
        status: "success",
        message: "Orchestrator finished successfully (No operation matched)",
        actionId,
    };
});
