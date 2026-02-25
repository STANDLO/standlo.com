"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.choreography = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.choreography = (0, https_1.onCall)({
    region: "europe-west4",
    enforceAppCheck: true,
    consumeAppCheckToken: false, // Don't consume for async shoots just enforce
}, async (request) => {
    // 1. Mandatory Auth check
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated to access Choreography.");
    }
    const data = request.data;
    const { correlationId, actionId, entityId } = data;
    console.log(`[Choreography][${correlationId || 'no-corr-id'}] Queuing Async Action: ${actionId} on Entity: ${entityId}`);
    // TODO: Emit message to a real Google Cloud Pub/Sub topic to be picked up by background workers
    // For now, this just acknowledges the request instantly (Fire-and-forget)
    return {
        status: "accepted",
        message: "Action queued for asynchronous processing",
        actionId,
    };
});
//# sourceMappingURL=choreography.js.map