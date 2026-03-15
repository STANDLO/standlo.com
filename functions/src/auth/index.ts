import { beforeUserCreated, beforeUserSignedIn, HttpsError } from "firebase-functions/v2/identity";

const authRegion = "europe-west1";

/**
 * 1. Blocking Hook: beforeUserCreated
 * Triggers *before* a new user is saved to the Firebase Authentication database.
 * Used for strict validation, RBAC default assignment, or outright denying anomalous registrations.
 */
export const onBeforeUserCreated = beforeUserCreated({ region: authRegion }, async (event) => {
    const user = event.data;
    if (!user) return;
    
    console.info(`[Auth][beforeUserCreated] Validating new registration for: ${user.email}`);

    // Sandbox Example: Deny disposable email domains
    if (user.email?.endsWith("@yopmail.com")) {
        throw new HttpsError("invalid-argument", "Disposable emails are not allowed.");
    }

    // You can attach custom claims directly upon creation
    return {
        customClaims: {
            roles: ["guest"],
            requireProfileUpdate: true
        }
    };
});

/**
 * 2. Blocking Hook: beforeUserSignedIn
 * Triggers *every time* a user attempts to log in (before receiving the auth token).
 * Used for session auditing, MFA enforcement enforcement, or blocking suspended accounts.
 */
export const onBeforeUserSignedIn = beforeUserSignedIn({ region: authRegion }, async (event) => {
    const user = event.data;
    if (!user) return {};

    console.info(`[Auth][beforeUserSignedIn] Validating login for: ${user.email}`);

    // Sandbox Example: Deny users missing a verified email if strictly required by your platform
    /*
    if (!user.emailVerified) {
        throw new HttpsError("permission-denied", "Please verify your email before logging in.");
    }
    */

    // Returning empty object means login is approved without modifying the existing token claims
    return {};
});
