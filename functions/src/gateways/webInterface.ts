import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GatewayRequest } from "../types";
import { generateManifestForEntity } from "../rbac/policyEngine";
import { OrganizationSchema, RoleId } from "../schemas";
import { z } from "zod";

export const webInterface = onCall({
    region: "europe-west4",
    enforceAppCheck: true,
    consumeAppCheckToken: false,
}, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated to retrieve Web Interface manifests.");
    }

    const data = request.data as GatewayRequest;
    const { correlationId, orgId, roleId } = data;

    console.log(`[WebInterface][${correlationId || 'no-corr-id'}] Requesting UI Schema Manifest for Role: ${roleId} in Org: ${orgId}`);

    // Call the Policy Engine to dynamically generate the SDUI payload
    const organizationManifest = generateManifestForEntity('organization', roleId as RoleId, OrganizationSchema as z.ZodObject<z.ZodRawShape>);

    return {
        status: "success",
        manifest: {
            organization: organizationManifest
        },
    };
});
