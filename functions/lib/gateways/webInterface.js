"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webInterface = void 0;
const https_1 = require("firebase-functions/v2/https");
const policyEngine_1 = require("../rbac/policyEngine");
const schemas_1 = require("../schemas");
exports.webInterface = (0, https_1.onCall)({
    region: "europe-west4",
    enforceAppCheck: true,
    consumeAppCheckToken: false,
}, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated to retrieve Web Interface manifests.");
    }
    const data = request.data;
    const { correlationId, orgId, roleId } = data;
    console.log(`[WebInterface][${correlationId || 'no-corr-id'}] Requesting UI Schema Manifest for Role: ${roleId} in Org: ${orgId}`);
    // Call the Policy Engine to dynamically generate the SDUI payloads
    const organizationManifest = (0, policyEngine_1.generateManifestForEntity)('organization', roleId, schemas_1.OrganizationSchema);
    // Call the Policy Engine to get the Navigation Tree mapped to this Role
    const navigationManifest = (0, policyEngine_1.generateNavigationManifest)(roleId);
    return {
        status: "success",
        manifest: {
            organization: organizationManifest,
            navigation: navigationManifest
        },
    };
});
//# sourceMappingURL=webInterface.js.map