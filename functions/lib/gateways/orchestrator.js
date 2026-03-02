"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    if (actionId === "activate_user") {
        if (!payload) {
            throw new https_1.HttpsError("invalid-argument", "Payload is required to activate user.");
        }
        const { activateUser } = await Promise.resolve().then(() => __importStar(require("../orchestrator/admin")));
        return activateUser(request.auth.uid, payload);
    }
    if (actionId === "get_admin_kpis") {
        const { getAdminKpis } = await Promise.resolve().then(() => __importStar(require("../orchestrator/admin")));
        return getAdminKpis(request.auth.uid);
    }
    // --- ROUTER END ---
    return {
        status: "success",
        message: "Orchestrator finished successfully (No operation matched)",
        actionId,
    };
});
//# sourceMappingURL=orchestrator.js.map