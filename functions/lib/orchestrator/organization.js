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
exports.onboardOrganization = onboardOrganization;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
const https_1 = require("firebase-functions/v2/https");
const schemas_1 = require("../schemas");
async function onboardOrganization(uid, orgData) {
    var _a;
    const userRec = await admin.auth().getUser(uid);
    const currentCustomClaims = userRec.customClaims || {};
    if (currentCustomClaims.onboarding) {
        throw new https_1.HttpsError("already-exists", "User is already onboarded.");
    }
    if (!orgData || typeof orgData !== "object" || Object.keys(orgData).length === 0) {
        throw new https_1.HttpsError("invalid-argument", "Organization payload is missing or empty.");
    }
    try {
        const parsedData = schemas_1.OrganizationSchema.partial().parse(orgData);
        // Clean up undefined values from parsedData as Firestore rejects them
        const sanitizedData = Object.fromEntries(Object.entries(parsedData).filter(([, v]) => v !== undefined));
        // 3. Define the actual active status
        const role = parsedData.roleId;
        const isActive = role === "customer";
        // 4. Initialize Firestore Batch Transaction (Using Named DB "standlo")
        const db = (0, firestore_1.getFirestore)(admin.app(), "standlo");
        const batch = db.batch();
        const orgRootId = uid;
        // Organization Document
        const orgRef = db.collection("organizations").doc(orgRootId);
        batch.set(orgRef, Object.assign(Object.assign({}, sanitizedData), { active: isActive, createdAt: admin.firestore.FieldValue.serverTimestamp(), createdBy: uid, updatedAt: admin.firestore.FieldValue.serverTimestamp(), updatedBy: uid }), { merge: true });
        // Update User Document
        const userRef = db.collection("users").doc(uid);
        batch.set(userRef, {
            active: isActive,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        // 5. Upgrade Custom Claims via Admin SDK
        const newClaims = Object.assign(Object.assign({}, currentCustomClaims), { role: role || "pending", onboarding: true, orgId: orgRootId, orgName: parsedData.name || null, logoUrl: parsedData.logoUrl || null });
        // Estrapolazione Country Code dalla P.IVA (es. "IT123456789" -> "IT")
        const countryCode = parsedData.vatNumber && parsedData.vatNumber.length >= 2
            ? parsedData.vatNumber.substring(0, 2).toUpperCase()
            : null;
        if (countryCode && ((_a = parsedData.place) === null || _a === void 0 ? void 0 : _a.zipCode)) {
            newClaims.location = `${countryCode}-${parsedData.place.zipCode}`;
        }
        if (role) {
            newClaims[`${role}Id`] = orgRootId;
            newClaims[`${role}Name`] = parsedData.name || null;
        }
        const sanitizedClaims = Object.fromEntries(Object.entries(newClaims).filter(([, v]) => v !== undefined));
        batch.update(userRef, { claims: sanitizedClaims });
        await batch.commit();
        await admin.auth().setCustomUserClaims(uid, sanitizedClaims);
        // Generate Custom Token to synchronize client Edge cookies instantly
        const customToken = await admin.auth().createCustomToken(uid);
        return {
            status: "success",
            message: "Onboarding completed successfully.",
            customToken
        };
    }
    catch (error) {
        console.error("[Orchestrator][onboardOrganization] Error:", error);
        if (error instanceof Error) {
            if (error.name === "ZodError") {
                throw new https_1.HttpsError("invalid-argument", "Organization schema validation failed.", error.errors);
            }
            throw new https_1.HttpsError("internal", error.message || "An internal error occurred during onboarding.");
        }
        throw new https_1.HttpsError("internal", "An unknown error occurred during onboarding.");
    }
}
//# sourceMappingURL=organization.js.map