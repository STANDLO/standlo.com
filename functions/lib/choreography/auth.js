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
exports.recordAuthEvent = recordAuthEvent;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
/**
 * Records an authentication event in the Firestore "auth" collection.
 * Features a fast-bounce deduplication check (10 seconds) for the same event type and sessionId/uid.
 */
async function recordAuthEvent(event) {
    if (admin.apps.length === 0)
        return;
    const db = (0, firestore_1.getFirestore)(admin.app(), "standlo");
    const authCollection = db.collection("auth");
    // Deduplication check window: 10 seconds ago
    const tenSecondsAgo = new Date(Date.now() - 10000);
    // Build the query
    let query = authCollection
        .where("type", "==", event.type)
        .where("createdAt", ">=", tenSecondsAgo);
    if (event.sessionId) {
        query = query.where("sessionId", "==", event.sessionId);
    }
    else {
        query = query.where("uid", "==", event.uid);
    }
    try {
        const recentEvents = await query.limit(1).get();
        if (!recentEvents.empty) {
            console.log(`[AuthChoreography] Deduplicated ${event.type} event for uid: ${event.uid}`);
            return; // Skip writing the event
        }
        // Write the event
        const docRef = authCollection.doc();
        const baseDoc = {
            id: docRef.id,
            active: true,
            version: 1,
            code: `AUTH-${Date.now().toString().slice(-6)}`,
            createdAt: new Date(),
            createdBy: "system",
        };
        await docRef.set(Object.assign(Object.assign({}, baseDoc), event));
        console.log(`[AuthChoreography] Logged ${event.type} event for uid: ${event.uid} (Session: ${event.sessionId})`);
    }
    catch (error) {
        console.error(`[AuthChoreography] Error recording auth event:`, error);
        // We do not throw to prevent blocking the Orchestrator
    }
}
//# sourceMappingURL=auth.js.map