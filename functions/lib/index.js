"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.beforeSignIn = exports.beforeCreate = void 0;
const identity_1 = require("firebase-functions/v2/identity");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const app = admin.initializeApp();
const db = (0, firestore_1.getFirestore)(app, "default");
const REGION = "europe-west4";
/**
 * Triggered before a new user account is created.
 * Configured in Identity Platform / Firebase Auth Settings -> Blocking Functions.
 */
exports.beforeCreate = (0, identity_1.beforeUserCreated)({ region: REGION }, async (event) => {
    const user = event.data;
    if (!user || (!user.uid && !user.email))
        return {};
    const existingClaims = user.customClaims || {};
    // Tutti gli utenti, sia da Email che da Social, nascono "pending"
    // Fino a quando non compileranno l'onboarding obbligatorio.
    const role = "pending";
    // Default dinamico per il mapping in Firestore e nel JWT
    const claims = Object.assign(Object.assign({}, existingClaims), { role: role, orgId: null, orgName: null, userId: user.uid, userName: user.displayName || null, locale: existingClaims.locale || "it", theme: existingClaims.theme || "light", fairIds: existingClaims.fairIds || [] // Array of logistic hubs
     });
    // Auto-provisioning: Creiamo SOLO l'utente radice silente (active: false)
    try {
        const userRef = db.collection("users").doc(user.uid);
        await userRef.set({
            email: user.email || null,
            displayName: user.displayName || null,
            phoneNumber: user.phoneNumber || null,
            active: false, // Inattivo finché non completa onboarding
            claims: claims,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Successfully provisioned initial User document for ${user.uid} with role: pending`);
    }
    catch (error) {
        console.error(`Error provisioning Firestore User doc for ${user.uid}:`, error);
        // We still allow registration to proceed even if DB sync fails
        // ma l'onboarding forzerà poi un re-sync salvifico.
    }
    // Embed the claims directly into the JWT token
    return {
        customClaims: claims
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
            // If soft deleted/banned
            if ((userData === null || userData === void 0 ? void 0 : userData.active) === false) {
                // In a blocking function, throwing an HttpsError blocks the sign in
                throw new Error("auth/user-disabled"); // Identity platform intercepts this
            }
            if (userData === null || userData === void 0 ? void 0 : userData.claims) {
                return {
                    customClaims: userData.claims
                };
            }
        }
    }
    catch (error) {
        console.error(`Error reading real-time claims for user ${user.uid}:`, error);
        if (error instanceof Error && error.message === "auth/user-disabled") {
            throw error;
        }
    }
    return {};
});
//# sourceMappingURL=index.js.map