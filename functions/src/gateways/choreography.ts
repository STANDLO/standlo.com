import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GatewayRequest } from "../types";
import { saveCanvasEntity } from "../choreography/canvas";

export const choreography = onCall({
    region: "europe-west4",
    enforceAppCheck: true,
    cors: process.env.FUNCTIONS_EMULATOR === "true" ? true : ["https://standlo.com", "https://www.standlo.com"],
    consumeAppCheckToken: false, // Don't consume for async shoots just enforce
}, async (request) => {
    // 1. Mandatory Auth check
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated to access Choreography.");
    }

    const data = request.data as GatewayRequest;
    const { correlationId, actionId, entityId, payload, orgId } = data;

    const resolvedOrgId = orgId || request.auth.token?.orgId || "unknown";

    console.log(`[Choreography][${correlationId || 'no-corr-id'}] Queuing Async Action: ${actionId} on Entity: ${entityId}`);

    if (actionId === "save_canvas") {
        const docId = payload?.id;
        if (!docId) {
            throw new HttpsError("invalid-argument", "Payload must contain an 'id' property representing the document ID.");
        }

        // Extract the objects array. In the legacy pipeline it was called 'nodes'.
        // This will be mapped to the objects sub-collection by saveCanvasEntity.
        const objectsArray = payload.objects && Array.isArray(payload.objects) ? payload.objects : [];

        // Wait for the save; typical async functions in GC terminate if not awaited or not using pub/sub
        await saveCanvasEntity(request.auth.uid, entityId as string, docId as string, resolvedOrgId as string, objectsArray);

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
