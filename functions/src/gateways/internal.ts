import { CallableRequest } from "firebase-functions/v2/https";
import { GatewayRequest } from "../types";
import { DecodedIdToken } from "firebase-admin/auth";

/**
 * Helper to construct a synthetic CallableRequest for internal execution of Gateway functions.
 * Simulates an authenticated user request for `firestore.run()`.
 */
export function createInternalRequest(data: GatewayRequest, uid?: string, orgId?: string): CallableRequest<GatewayRequest> {
    const userId = uid || "system";
    const organizationId = orgId || "system";
    const now = Math.floor(Date.now() / 1000);
    
    const token: DecodedIdToken = {
        email_verified: true,
        auth_time: now,
        exp: now + 3600,
        iat: now,
        iss: "https://securetoken.google.com/standlo-1",
        sub: userId,
        aud: "standlo-1",
        uid: userId,
        orgId: organizationId,
        firebase: { identities: {}, sign_in_provider: "custom" }
    };

    const auth = {
        uid: userId,
        token
    } as unknown as NonNullable<CallableRequest["auth"]>;

    return {
        data,
        auth,
        rawRequest: { rawBody: Buffer.from("") } as unknown as CallableRequest["rawRequest"],
        acceptsStreaming: false
    } as unknown as CallableRequest<GatewayRequest>;
}
