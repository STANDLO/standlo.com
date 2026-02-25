import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GatewayRequest } from "../types";

export const brain = onCall({
    region: "europe-west4",
    enforceAppCheck: true,
    consumeAppCheckToken: false,
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated to access Brain AI hub.");
    }

    const data = request.data as GatewayRequest;
    const { correlationId, actionId, entityId, payload } = data;

    console.log(`[Brain][${correlationId || 'no-corr-id'}] AI Processing Task: ${actionId} for Entity: ${entityId}`);
    console.log(`[Brain] Payload present: ${!!payload}`);

    // TODO: Connect to Vertex AI / OpenAI / LangChain algorithms

    return {
        status: "processing", // Might return preliminary data or stream
        message: "AI workflow started",
        actionId,
    };
});
