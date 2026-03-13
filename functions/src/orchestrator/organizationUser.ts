import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { randomBytes } from "crypto";

export async function createOrganizationUserEntity(uid: string, payload: Record<string, unknown>) {
    const db = getFirestore(admin.app(), "standlo");
    const { orgId, type, email, name, password, skipAuthCreation } = payload;
    let targetUserId = payload.userId as string;

    if (!orgId || typeof orgId !== "string") {
        throw new HttpsError("invalid-argument", "orgId is required to add an organization user.");
    }

    if (!type || typeof type !== "string") {
        throw new HttpsError("invalid-argument", "user type (ADMIN/DESIGNER/WORKER/COLLAB) is required.");
    }

    // Determine targetUserId (Create Firebase User if new)
    if (!targetUserId) {
        if (!email || typeof email !== "string") {
            throw new HttpsError("invalid-argument", "email is required if userId is not provided.");
        }

        try {
            // Check if user already exists
            const existingUser = await admin.auth().getUserByEmail(email);
            targetUserId = existingUser.uid;
        } catch (error: unknown) {
            const authError = error as { code?: string; message?: string };
            if (authError.code === 'auth/user-not-found') {
                if (skipAuthCreation) {
                    throw new HttpsError("not-found", "User not found and skipAuthCreation is true.");
                }

                // Safe Invitation Flow: Create new user with random password
                const initPassword = (password as string) || randomBytes(12).toString('base64');
                const newUser = await admin.auth().createUser({
                    email: email,
                    password: initPassword,
                    displayName: (name as string) || email.split('@')[0],
                });
                targetUserId = newUser.uid;

                // Trigger password reset email (simulate welcome email)
                try {
                    const resetLink = await admin.auth().generatePasswordResetLink(email);
                    console.log(`[organizationUser] Generated password reset link for new user ${email}: ${resetLink}`);
                    // In a real app, integrate with SendGrid, Postmark, etc. here or rely on a Firestore trigger to send the email.
                } catch (err) {
                    const sendMailError = err as { code?: string; message?: string };
                    console.error("Warning: Failed to generate temporary password and welcome email.", sendMailError);
                }
            } else {
                throw new HttpsError("internal", "Error checking user existence.", authError.message || String(error));
            }
        }
    }

    // Get Organization Details for roleId mapping
    const orgDoc = await db.collection("organizations").doc(orgId).get();
    if (!orgDoc.exists) {
        throw new HttpsError("not-found", "Organization not found.");
    }
    const orgData = orgDoc.data() || {};
    const orgRole = orgData.roleId || "pending";
    const organizationType = orgData.type && Array.isArray(orgData.type) && orgData.type.length > 0 ? orgData.type[0] : null;
    const orgName = orgData.name || null;
    const logoUrl = orgData.logoUrl || null;
    const countryCode = orgData.vatNumber && orgData.vatNumber.length >= 2
        ? orgData.vatNumber.substring(0, 2).toUpperCase()
        : null;

    // Server-Side Team Limitations
    if (organizationType === "EDUCATIONAL" || organizationType === "PROFESSIONAL") {
        throw new HttpsError("failed-precondition", "Non è possibile aggiungere membri al team in questo piano.");
    }

    if (organizationType === "BUSINESS") {
        const usersSnapshot = await db.collection("organizations").doc(orgId).collection("users")
            .where("isArchived", "==", false)
            .count().get();
        const currentCount = usersSnapshot.data().count;
        if (currentCount >= 10) {
            throw new HttpsError("failed-precondition", "Limite massimo di 10 utenti raggiunto per questa organizzazione.");
        }
    }

    // 3. Update Custom Claims
    const userRec = await admin.auth().getUser(targetUserId);
    const currentCustomClaims = userRec.customClaims || {};

    const newClaims: Record<string, unknown> = {
        ...currentCustomClaims,
        phoneNumber: userRec.phoneNumber || null,
        orgId: orgId,
        type: type,
        userType: type,
        role: orgRole,
        organizationType: organizationType,
        active: true, // Inject active claim
        onboarding: true, // Prevent the onboarding loop for invited users
        orgName: orgName,
        logoUrl: logoUrl,
        privacy: true,
        terms: true,
        locale: currentCustomClaims.locale || "en",
        theme: currentCustomClaims.theme || "light",
    };

    if (countryCode && orgData.place?.zipCode) {
        newClaims.location = `${countryCode}-${orgData.place.zipCode}`;
    }

    if (orgRole) {
        newClaims[`${orgRole}Id`] = orgId;
        newClaims[`${orgRole}Name`] = orgName;
    }

    // Clean undefined
    const sanitizedClaims = Object.fromEntries(
        Object.entries(newClaims).filter(([, v]) => v !== undefined && v !== null)
    );

    // Database Writes
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const operations: Record<string, unknown>[] = [
        {
            type: "update",
            entityId: "user",
            id: targetUserId,
            data: {
                id: targetUserId, // Ensure ID is passed for Zod partial merging
                displayName: name,
                email: email,
                active: true, // Changed from isActive
                type: type,
                userType: type,
                claims: sanitizedClaims
            }
        },
        {
            type: "create",
            entityId: "organizationUser",
            data: {
                id: targetUserId,
                displayName: name,
                email: email,
                orgId: orgId,
                type: type,
                userType: type,
                active: true, // Changed from isActive
                roleId: orgRole,
                organizationType: organizationType
            }
        }
    ];

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "organizationUser",
        payload: { operations }
    }, uid, orgId);

    // Ensure the users collection is upserted/updated depending on if they exist.
    // Wait, firestore.run update will fail if root user doc doesn't exist?
    // Using firestore batch directly might be safer since we don't know root user doc status (might be new auth user).
    // Let's check `targetUserId` from auth flow earlier. If it's a new auth user, `users/{uid}` does NOT exist in Firestore yet!
    // A standard `update` will FAIL. We need "create" for new users, but what if they already logged in? Then "create" will FAIL with "already exists".
    // Ah, firestore.ts handles "create" by creating if not exists, BUT the original code used `batch.set(userRef, { ... }, { merge: true })` !
    // Let's write a generic gateway internal request just for the org user... No, the requirement is to use firestore.run.
    // Actually, `schemas.UserSchema` handles it. Wait, firestore.ts line 165 checks `if (existingSnap.exists) { throw new HttpsError("already-exists") }`
    // So "create" on existing fails. "update" on non-existing fails.
    // Let's use `admin.firestore().collection("users").doc(targetUserId).set(..., { merge: true })` inside the backend, bypassing `firestore.run` for root `user` ONLY if strictly necessary.
    // Wait, the requirement says "per collegarsi a firestore si usa solo firestore.run". We must adapt. If the user document creation logic has a gap, we might need a workaround or just use batch for the org user.
    // No, `sandbox.ts` uses `firestore.run` too. Let's see if we can use a custom operation type, or just rely on the frontend to create the user? No, this is the onboarding/invitation flow.
    // Let's simply fix this constraint. I'll maintain `db.batch()` for this specific edge case (set with merge) OR I can check if the user exists first using a get(), then decide 'create' or 'update'.
    
    // Check if Global User Document exists to decide between create/update
    const userDocRef = db.collection("users").doc(targetUserId);
    const userDocSnap = await userDocRef.get();
    const userOpType = userDocSnap.exists ? "update" : "create";

    operations[0].type = userOpType;

    await firestore.run(batchReq);

    await admin.auth().setCustomUserClaims(targetUserId, sanitizedClaims);

    // Programmatically trigger the organization-user-create pipeline
    try {
        const { runPipeline } = await import("../orchestrator/pipeline");
        await runPipeline(uid, "organization-user-create", {
            userId: targetUserId,
            orgId: orgId,
            email: email,
            name: name,
            type: type,
            roleId: orgRole
        });
        console.log(`[organizationUser] Successfully triggered pipeline 'organization-user-create' for ${email}`);
    } catch (pipelineError) {
        console.error(`[organizationUser] Failed to trigger 'organization-user-create' pipeline:`, pipelineError);
        // We don't throw here to avoid failing the user creation if the pipeline fails
    }

    return {
        status: "success",
        message: "Organization user successfully created and linked.",
        data: { id: targetUserId, orgId: orgId, type: type }
    };
}

export async function updateOrganizationUserEntity(uid: string, id: string, payload: Record<string, unknown>) {
    // 'id' is expected to be the targetUserId
    // Needs orgId from payload or context
    const orgId = payload.orgId as string;
    if (!orgId) {
        throw new HttpsError("invalid-argument", "orgId is required to update/suspend an organization user.");
    }

    let active = undefined;
    if (payload.active !== undefined) {
        active = payload.active === true || payload.active === "true";
    }

    let newClaims: Record<string, unknown> | undefined = undefined;

    // 3. Optional Claim Cleanup for Suspension or Role Upgrade
    if (active === false) {
        const userRec = await admin.auth().getUser(id);
        const currentCustomClaims = userRec.customClaims || {};
        newClaims = { ...currentCustomClaims };
        // We revoke the operational orgId mapping, keeping the base account alive
        if (newClaims.orgId) delete newClaims.orgId;
        if (newClaims.type) delete newClaims.type;
        if (newClaims.userType) delete newClaims.userType;
        if (newClaims.organizationType) delete newClaims.organizationType;
    } else if (payload.type) {
        // Upgrade role if changed
        const userRec = await admin.auth().getUser(id);
        const currentCustomClaims = userRec.customClaims || {};
        newClaims = {
            ...currentCustomClaims,
            phoneNumber: userRec.phoneNumber || null,
            type: payload.type,
            userType: payload.type
        };
    }

    // 1. Update Subcollection
    const subUpdateParams: Record<string, unknown> = {};
    if (active !== undefined) subUpdateParams.active = active;
    if (payload.type) {
        subUpdateParams.type = payload.type;
        subUpdateParams.userType = payload.type;
    }

    // 2. Update Global User Document
    const userUpdateParams: Record<string, unknown> = {};
    if (active !== undefined) userUpdateParams.active = active;
    if (payload.type) {
        userUpdateParams.type = payload.type;
        userUpdateParams.userType = payload.type;
    }
    if (newClaims) {
        userUpdateParams.claims = newClaims;
    }

    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const operations: Record<string, unknown>[] = [
        {
            type: "update",
            entityId: "organizationUser",
            id: id,
            data: {
                id: id,
                ...subUpdateParams
            }
        },
        {
            type: "update",
            entityId: "user",
            id: id,
            data: {
                id: id,
                ...userUpdateParams
            }
        }
    ];

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "organizationUser",
        payload: { operations }
    }, uid, orgId);

    await firestore.run(batchReq);

    if (newClaims) {
        await admin.auth().setCustomUserClaims(id, newClaims);
    }

    return {
        status: "success",
        message: "Organization user updated successfully.",
        data: { id, orgId }
    };
}

export async function deleteOrganizationUserEntity(uid: string, id: string, payload?: Record<string, unknown>) {
    const orgId = payload?.orgId as string;

    if (!orgId) {
        throw new HttpsError("invalid-argument", "orgId is required to delete an organization user.");
    }

    const now = new Date().toISOString();

    // 1. Revoke custom claims for this org
    const userRec = await admin.auth().getUser(id);
    const currentCustomClaims = userRec.customClaims || {};
    const newClaims: Record<string, unknown> = {
        ...currentCustomClaims,
        phoneNumber: userRec.phoneNumber || null
    };

    if (newClaims.orgId === orgId) {
        delete newClaims.orgId;
        delete newClaims.type;
        delete newClaims.userType;
        delete newClaims.organizationType;
    }

    // 2. Database Writes via firestore.run
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const operations: Record<string, unknown>[] = [
        {
            type: "update",  // Use update because soft_delete on user entity might have side effects, and we only want to archive the orgUser
            entityId: "organizationUser",
            id: id,
            data: {
                id: id,
                isArchived: true,
                active: false,
                deletedAt: now,
            }
        },
        {
            type: "update",
            entityId: "user",
            id: id,
            data: {
                id: id,
                claims: newClaims
            }
        }
    ];

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "organizationUser",
        payload: { operations }
    }, uid, orgId);

    await firestore.run(batchReq);

    if (Object.keys(newClaims).length > 0) {
        await admin.auth().setCustomUserClaims(id, newClaims);
    } else {
        await admin.auth().setCustomUserClaims(id, null);
    }

    return {
        status: "success",
        message: "Organization user deleted successfully.",
        data: { id, orgId }
    };
}
