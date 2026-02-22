import { beforeUserCreated, beforeUserSignedIn } from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

const app = admin.initializeApp();
const db = getFirestore(app, "default");

const REGION = "europe-west4";

/**
 * Triggered before a new user account is created.
 * Configured in Identity Platform / Firebase Auth Settings -> Blocking Functions.
 */
export const beforeCreate = beforeUserCreated({ region: REGION }, async (event) => {
    const user = event.data;

    if (!user || (!user.uid && !user.email)) return {};

    const existingClaims = user.customClaims || {};
    // Tutti gli utenti, sia da Email che da Social, nascono "pending"
    // Fino a quando non compileranno l'onboarding obbligatorio.
    const role = "pending";

    // Default dinamico per il mapping in Firestore e nel JWT
    const claims: Record<string, string | boolean | string[] | null | undefined> = {
        ...existingClaims,
        role: role as string,
        onboarding: false, // Explicit onboarding state boolean
        orgId: null,      // Sarà creato dall'onboarding
        orgName: null,
        userId: user.uid,
        userName: user.displayName || null,
        locale: existingClaims.locale || "it", // Default locale base
        theme: existingClaims.theme || "light", // Default theme base
        fairIds: existingClaims.fairIds || [] // Array of logistic hubs
    };

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
    } catch (error) {
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
export const beforeSignIn = beforeUserSignedIn({ region: REGION }, async (event) => {
    const user = event.data;

    if (!user || !user.uid) return {};

    try {
        // Read the absolute latest claims from Firestore to keep the JWT dynamically updated at each login
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();

            // If soft deleted/banned
            if (userData?.active === false) {
                // In a blocking function, throwing an HttpsError blocks the sign in
                throw new Error("auth/user-disabled"); // Identity platform intercepts this
            }

            if (userData?.claims) {
                return {
                    customClaims: userData.claims
                };
            }
        }
    } catch (error) {
        console.error(`Error reading real-time claims for user ${user.uid}:`, error);
        if (error instanceof Error && error.message === "auth/user-disabled") {
            throw error;
        }
    }

    return {};
});
