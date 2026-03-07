import { HttpsError } from "firebase-functions/v2/https";
import { AuthEventSchema } from "../schemas/auth";

/**
 * Handles incoming authentication events from the client.
 * Enforces schema validation and enriches the payload with server-side metadata before 
 * triggering the choreography layer in fire-and-forget mode.
 */
export async function handleAuthEvent(
    uid: string,
    ipAddress: string | undefined,
    userAgent: string | undefined,
    payload: Record<string, unknown>
) {
    if (!payload.type) {
        throw new HttpsError("invalid-argument", "Missing event 'type' in payload.");
    }

    // Combine payload with server-trust details
    const enrichedPayload = {
        ...payload,
        uid: uid,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined
    };

    const parsed = AuthEventSchema.safeParse(enrichedPayload);

    if (!parsed.success) {
        throw new HttpsError("invalid-argument", `Invalid Auth Event Payload: ${JSON.stringify(parsed.error.issues)}`);
    }

    // Fire and forget: DO NOT AWAIT to keep the client responsive
    import("../choreography/auth").then(({ recordAuthEvent }) => {
        recordAuthEvent(parsed.data).catch(err => {
            console.error("[AuthOrchestrator] Async choreography failure:", err);
        });
    }).catch(err => {
        console.error("[AuthOrchestrator] Failed to load choreography layer:", err);
    });

    return {
        status: "success",
        message: "Auth event acknowledged"
    };
}
