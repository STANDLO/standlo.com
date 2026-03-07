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
exports.handleAuthEvent = handleAuthEvent;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("../schemas/auth");
/**
 * Handles incoming authentication events from the client.
 * Enforces schema validation and enriches the payload with server-side metadata before
 * triggering the choreography layer in fire-and-forget mode.
 */
async function handleAuthEvent(uid, ipAddress, userAgent, payload) {
    if (!payload.type) {
        throw new https_1.HttpsError("invalid-argument", "Missing event 'type' in payload.");
    }
    // Combine payload with server-trust details
    const enrichedPayload = Object.assign(Object.assign({}, payload), { uid: uid, ipAddress: ipAddress || undefined, userAgent: userAgent || undefined });
    const parsed = auth_1.AuthEventSchema.safeParse(enrichedPayload);
    if (!parsed.success) {
        throw new https_1.HttpsError("invalid-argument", `Invalid Auth Event Payload: ${JSON.stringify(parsed.error.issues)}`);
    }
    // Fire and forget: DO NOT AWAIT to keep the client responsive
    Promise.resolve().then(() => __importStar(require("../choreography/auth"))).then(({ recordAuthEvent }) => {
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
//# sourceMappingURL=auth.js.map