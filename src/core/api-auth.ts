import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { db } from "@/core/db";

export interface ApiAuthContext {
    orgId: string;
    uid: string;
    apiKeyHint?: string;
}

/**
 * Validates the `x-api-key` header against the Firestore hashed index.
 * Only works in Node.js runtime (not Edge) because it uses `firebase-admin/firestore`.
 */
export async function validateApiKey(request: NextRequest): Promise<ApiAuthContext | null> {
    const rawApiKey = request.headers.get("x-api-key");
    if (!rawApiKey) return null;

    const hashedKey = crypto.createHash("sha256").update(rawApiKey).digest("hex");

    const snapshot = await db.collection("apikeys")
        .where("hashedKey", "==", hashedKey)
        .where("active", "==", true)
        .limit(1)
        .get();

    if (snapshot.empty) return null;

    const keyData = snapshot.docs[0].data();

    // Async increment lastUsedAt
    snapshot.docs[0].ref.update({ lastUsedAt: Date.now() }).catch(console.error);

    return {
        orgId: keyData.orgId as string,
        uid: keyData.ownId as string,
        apiKeyHint: keyData.hint as string,
    };
}

/**
 * Higher Order Function to wrap API Route Handlers.
 * Enforces `x-api-key` and automatically logs the result into the `Call` entity.
 */
export function withApiKeyTracking(
    handler: (request: NextRequest, context: ApiAuthContext) => Promise<NextResponse>
) {
    return async (request: NextRequest): Promise<NextResponse> => {
        const startTime = Date.now();
        const apiContext = await validateApiKey(request);

        // Track Call function
        const logCall = (status: number) => {
            if (!apiContext?.apiKeyHint) return; // Non-API calls aren't tracked here
            const durationMs = Date.now() - startTime;
            const code = request.nextUrl.pathname;

            db.collection("calls").add({
                apiKeyHint: apiContext.apiKeyHint,
                status,
                method: request.method,
                durationMs,
                code, // Pathname like /api/v1/projects
                orgId: apiContext.orgId,
                ownId: apiContext.uid,
                createdAt: Date.now(),
                createdBy: apiContext.uid,
                active: true,
                version: 1
            }).catch(console.error);
        };

        if (!apiContext) {
            // Se non c'è chiave si potrebbe fallbackare a session token Firebase, 
            // ma se questo wrapper è usato esplicitamente, forziamo API Key.
            // Loggare le chiamate fallite anonime potrebbe essere un rischio vettoriale per DB Flood.
            return NextResponse.json({ error: "Unauthorized or Invalid API Key" }, { status: 401 });
        }

        try {
            const response = await handler(request, apiContext);
            logCall(response.status);
            return response;
        } catch (error) {
            console.error("API Error:", error);
            logCall(500);
            return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
        }
    };
}
