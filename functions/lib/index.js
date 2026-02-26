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
exports.webInterface = exports.brain = exports.firestoreGateway = exports.choreography = exports.orchestrator = exports.beforeSignIn = exports.beforeCreate = exports.systemLocales = void 0;
const identity_1 = require("firebase-functions/v2/identity");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const app = admin.initializeApp();
const db = (0, firestore_1.getFirestore)(app, "standlo"); // Enterprise Named Database
const REGION = "europe-west4";
exports.systemLocales = [
    { code: "it", nativeLabel: "Italia", flag: "🇮🇹" },
    { code: "es", nativeLabel: "España", flag: "🇪🇸" },
    { code: "en", nativeLabel: "United Kingdom", flag: "🇬🇧" },
    { code: "us", nativeLabel: "United States of America", flag: "🇺🇸" },
    { code: "de", nativeLabel: "Deutschland", flag: "🇩🇪" },
    { code: "fr", nativeLabel: "France", flag: "🇫🇷" }
];
/**
 * Triggered before a new user account is created.
 * Configured in Identity Platform / Firebase Auth Settings -> Blocking Functions.
 */
exports.beforeCreate = (0, identity_1.beforeUserCreated)({ region: REGION }, async (event) => {
    const user = event.data;
    if (!user || (!user.uid && !user.email))
        return {};
    const existingClaims = user.customClaims || {};
    const role = "pending";
    // Build raw claims
    const rawClaims = Object.assign(Object.assign({}, existingClaims), { role: role, onboarding: false, active: true, privacy: true, terms: true, orgId: null, orgName: null, locale: existingClaims.locale || "en", theme: existingClaims.theme || "light" });
    // Strip undefined values which crash Firestore AND Identity Platform. 
    // We also strip nulls to avoid issues with reserved constraints just in case.
    const safeClaims = Object.fromEntries(Object.entries(rawClaims).filter(([, v]) => v !== undefined && v !== null));
    try {
        const userRef = db.collection("users").doc(user.uid);
        await userRef.set({
            email: user.email || null,
            displayName: user.displayName || null,
            phoneNumber: user.phoneNumber || null,
            active: false,
            claims: safeClaims,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Successfully provisioned initial User document for ${user.uid} with role: pending`);
    }
    catch (error) {
        console.error(`Error provisioning Firestore User doc for ${user.uid}:`, error);
    }
    return {
        customClaims: safeClaims
    };
});
/**
 * Triggered on every sign-in attempt.
 * Configured in Identity Platform / Firebase Auth Settings -> Blocking Functions.
 */
exports.beforeSignIn = (0, identity_1.beforeUserSignedIn)({ region: REGION }, async (event) => {
    const user = event.data;
    if (!user || !user.uid)
        return {};
    try {
        // Read the absolute latest claims from Firestore to keep the JWT dynamically updated at each login
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            // We do NOT block on "active: false" because that is the default state for users
            // before they complete the mandatory onboarding form.
            // Banned users should be disabled directly via Firebase Auth Admin (user.disabled).
            if (userData === null || userData === void 0 ? void 0 : userData.claims) {
                return {
                    customClaims: userData.claims
                };
            }
        }
    }
    catch (error) {
        console.error(`Error reading real-time claims for user ${user.uid}:`, error);
    }
    return {};
});
// ============================================================================
// GATEWAY ARCHITECTURE (5-Gateways Pattern)
// ============================================================================
var orchestrator_1 = require("./gateways/orchestrator");
Object.defineProperty(exports, "orchestrator", { enumerable: true, get: function () { return orchestrator_1.orchestrator; } });
var choreography_1 = require("./gateways/choreography");
Object.defineProperty(exports, "choreography", { enumerable: true, get: function () { return choreography_1.choreography; } });
var firestore_2 = require("./gateways/firestore"); // Prevent naming collisions with 'firebase-admin/firestore' export
Object.defineProperty(exports, "firestoreGateway", { enumerable: true, get: function () { return firestore_2.firestore; } });
var brain_1 = require("./gateways/brain");
Object.defineProperty(exports, "brain", { enumerable: true, get: function () { return brain_1.brain; } });
var webInterface_1 = require("./gateways/webInterface");
Object.defineProperty(exports, "webInterface", { enumerable: true, get: function () { return webInterface_1.webInterface; } });
//# sourceMappingURL=index.js.map