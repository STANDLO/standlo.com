"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchestrator = void 0;
const https_1 = require("firebase-functions/v2/https");
const organization_1 = require("../orchestrator/organization");
exports.orchestrator = (0, https_1.onCall)({
    region: "europe-west4",
    enforceAppCheck: true,
    consumeAppCheckToken: false,
}, async (request) => {
    // 1. Mandatory Auth check
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated to access Orchestrator.");
    }
    const data = request.data;
    const { correlationId, idempotencyKey, orgId, userId, roleId, entityId, actionId, payload } = data;
    // Log the initiation of the workflow tracing it with correlationId
    console.log(`[Orchestrator][${correlationId || 'no-corr-id'}] Action: ${actionId} on Entity: ${entityId} started by User: ${request.auth.uid}`);
    console.log(`[Orchestrator] Details: orgId=${orgId}, userId=${userId}, roleId=${roleId}, idempotencyKey=${idempotencyKey}, payload=${!!payload}`);
    // TODO: Verify idempotencyKey against Firestore 'idempotency_locks' to prevent duplicated logic execution
    // --- ROUTER START ---
    if (actionId === "onboard_organization") {
        if (!payload) {
            throw new https_1.HttpsError("invalid-argument", "Payload is required for onboarding.");
        }
        return (0, organization_1.onboardOrganization)(request.auth.uid, payload);
    }
    // --- ROUTER END ---
    return {
        status: "success",
        message: "Orchestrator finished successfully (No operation matched)",
        actionId,
    };
});
//# sourceMappingURL=orchestrator.js.map