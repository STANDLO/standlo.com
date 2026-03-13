
import { beforeUserCreated, beforeUserSignedIn } from "firebase-functions/v2/identity";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

import { setGlobalOptions } from "firebase-functions/v2";

const app = admin.initializeApp();
const db = getFirestore(app, "standlo"); // Enterprise Named Database

const REGION = "europe-west4";

// Configure all v2 functions to have at least 1 minimum instance
setGlobalOptions({ region: REGION, minInstances: 1 });

/**
 * Triggered before a new user account is created.
 * Configured in Identity Platform / Firebase Auth Settings -> Blocking Functions.
 */
export const beforeCreate = beforeUserCreated({ region: REGION }, async (event) => {
    const user = event.data;

    if (!user || (!user.uid && !user.email)) return {};

    const existingClaims = user.customClaims || {};
    const role = "pending";

    // Build raw claims
    const rawClaims: Record<string, string | boolean | string[] | null | undefined> = {
        ...existingClaims,
        role: role,
        onboarding: false,
        active: false,
        privacy: true,
        terms: true,
        orgId: null,
        orgName: null,
        locale: existingClaims.locale || "en",
        theme: existingClaims.theme || "light"
    };

    // Strip undefined values which crash Firestore AND Identity Platform. 
    // We also strip nulls to avoid issues with reserved constraints just in case.
    const safeClaims = Object.fromEntries(
        Object.entries(rawClaims).filter(([, v]) => v !== undefined && v !== null)
    );

    try {
        const userRef = db.collection("users").doc(user.uid);
        await userRef.set({
            email: user.email || null,
            displayName: user.displayName || null,
            phoneNumber: user.phoneNumber || null,
            active: false,
            claims: safeClaims,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`Successfully provisioned initial User document for ${user.uid} with role: pending`);
    } catch (error) {
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
export const beforeSignIn = beforeUserSignedIn({ region: REGION }, async (event) => {
    const user = event.data;

    if (!user || !user.uid) return {};

    try {
        // Read the absolute latest claims from Firestore to keep the JWT dynamically updated at each login
        const userDoc = await db.collection("users").doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();

            // We do NOT block on "active: false" because that is the default state for users
            // before they complete the mandatory onboarding form.
            // Banned users should be disabled directly via Firebase Auth Admin (user.disabled).

            if (userData?.claims) {
                return {
                    customClaims: userData.claims
                };
            }
        }
    } catch (error) {
        console.error(`Error reading real-time claims for user ${user.uid}:`, error);
    }

    return {};
});

// ============================================================================
// GATEWAY ARCHITECTURE (5-Gateways Pattern)
// ============================================================================
export { orchestrator } from "./gateways/orchestrator";
export { choreography } from "./gateways/choreography";
export { firestore as firestoreGateway } from "./gateways/firestore"; // Prevent naming collisions with 'firebase-admin/firestore' export
export { brain } from "./gateways/brain";
export { webhooks } from "./gateways/webhooks";
export { pipelineTriggers } from "./gateways/firestoreTriggers";
export { schemaExporter } from "./gateways/schemaExporter";

// ============================================================================
// GENERATIVE CORRELATION (CORE)
// ============================================================================
export { correlateRoot, correlateSub } from "./choreography/correlator";

// ============================================================================
// BACKGROUND TASK QUEUES
// ============================================================================
export {
    choreographyCanvasCreateSandbox,
    choreographyCanvasCreateNode,
    choreographyCanvasUpdateNode,
    choreographyCanvasDeleteNode
} from "./choreography/canvas";
