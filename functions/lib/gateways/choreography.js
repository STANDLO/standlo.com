"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.choreography = void 0;
const https_1 = require("firebase-functions/v2/https");
const canvas_1 = require("../choreography/canvas");
exports.choreography = (0, https_1.onCall)({
    region: "europe-west4",
    enforceAppCheck: true,
    cors: process.env.FUNCTIONS_EMULATOR === "true" ? true : ["https://standlo.com", "https://www.standlo.com"],
    consumeAppCheckToken: false, // Don't consume for async shoots just enforce
}, async (request) => {
    var _a;
    // 1. Mandatory Auth check
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated to access Choreography.");
    }
    const data = request.data;
    const { correlationId, actionId, entityId, payload, orgId } = data;
    const resolvedOrgId = orgId || ((_a = request.auth.token) === null || _a === void 0 ? void 0 : _a.orgId) || "unknown";
    console.log(`[Choreography][${correlationId || 'no-corr-id'}] Queuing Async Action: ${actionId} on Entity: ${entityId}`);
    if (actionId === "save_canvas") {
        const docId = payload === null || payload === void 0 ? void 0 : payload.id;
        if (!docId) {
            throw new https_1.HttpsError("invalid-argument", "Payload must contain an 'id' property representing the document ID.");
        }
        // Extract the objects array. In the legacy pipeline it was called 'nodes'.
        // This will be mapped to the objects sub-collection by saveCanvasEntity.
        const objectsArray = payload.objects && Array.isArray(payload.objects) ? payload.objects : [];
        // Wait for the save; typical async functions in GC terminate if not awaited or not using pub/sub
        await (0, canvas_1.saveCanvasEntity)(request.auth.uid, entityId, docId, resolvedOrgId, objectsArray);
        return {
            status: "success",
            message: "Canvas saved successfully.",
            actionId,
        };
    }
    // TODO: Emit message to a real Google Cloud Pub/Sub topic to be picked up by background workers
    // For now, this just acknowledges the request instantly (Fire-and-forget)
    return {
        status: "accepted",
        message: "Action queued for asynchronous processing",
        actionId,
    };
});
//# sourceMappingURL=choreography.js.map