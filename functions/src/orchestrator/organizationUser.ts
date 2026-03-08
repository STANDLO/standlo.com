import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { randomBytes } from "crypto";

export async function createOrganizationUserEntity(uid: string, payload: Record<string, unknown>) {
    const db = getFirestore(admin.app(), "standlo");
    const { orgId, type, email, name, skipAuthCreation } = payload;
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
                const randomPassword = randomBytes(12).toString('base64');
                const newUser = await admin.auth().createUser({
                    email: email,
                    password: randomPassword,
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

    // 3. Update Custom Claims
    const userRec = await admin.auth().getUser(targetUserId);
    const currentCustomClaims = userRec.customClaims || {};

    const newClaims: Record<string, unknown> = {
        ...currentCustomClaims,
        orgId: orgId,
        type: type,
        userType: type,
        role: orgRole,
        organizationType: organizationType,
    };

    // Clean undefined
    const sanitizedClaims = Object.fromEntries(
        Object.entries(newClaims).filter(([, v]) => v !== undefined && v !== null)
    );

    // Database Writes
    const batch = db.batch();
    const now = new Date().toISOString();

    // 1. Update Global User Document
    const userRef = db.collection("users").doc(targetUserId);
    batch.set(userRef, {
        isActive: true,
        type: type,
        userType: type,
        claims: sanitizedClaims,
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    // 2. Write Organization Subcollection User
    const orgUserRef = db.collection("organizations").doc(orgId).collection("users").doc(targetUserId);
    batch.set(orgUserRef, {
        id: targetUserId,
        orgId: orgId,
        type: type,
        userType: type,
        isActive: true,
        roleId: orgRole,
        organizationType: organizationType,
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid
    }, { merge: true });

    await batch.commit();

    await admin.auth().setCustomUserClaims(targetUserId, sanitizedClaims);

    return {
        status: "success",
        message: "Organization user successfully created and linked.",
        data: { id: targetUserId, orgId: orgId, type: type }
    };
}

export async function updateOrganizationUserEntity(uid: string, id: string, payload: Record<string, unknown>) {
    const db = getFirestore(admin.app(), "standlo");
    // 'id' is expected to be the targetUserId
    // Needs orgId from payload or context
    const orgId = payload.orgId as string;
    if (!orgId) {
        throw new HttpsError("invalid-argument", "orgId is required to update/suspend an organization user.");
    }

    const batch = db.batch();
    const now = new Date().toISOString();

    let isActive = undefined;
    if (payload.isActive !== undefined) {
        isActive = payload.isActive === true || payload.isActive === "true";
    }

    let newClaims: Record<string, unknown> | undefined = undefined;

    // 3. Optional Claim Cleanup for Suspension or Role Upgrade
    if (isActive === false) {
        const userRec = await admin.auth().getUser(id);
        const currentCustomClaims = userRec.customClaims || {};
        newClaims = { ...currentCustomClaims };
        // We revoke the operational orgId mapping, keeping the base account alive
        delete newClaims.orgId;
        delete newClaims.type;
        delete newClaims.userType;
        delete newClaims.organizationType;
    } else if (payload.type) {
        // Upgrade role if changed
        const userRec = await admin.auth().getUser(id);
        const currentCustomClaims = userRec.customClaims || {};
        newClaims = {
            ...currentCustomClaims,
            type: payload.type,
            userType: payload.type
        };
    }

    // 1. Update Subcollection
    const orgUserRef = db.collection("organizations").doc(orgId).collection("users").doc(id);
    const subUpdateParams: Record<string, unknown> = {
        updatedAt: now,
        updatedBy: uid
    };
    if (isActive !== undefined) subUpdateParams.isActive = isActive;
    if (payload.type) {
        subUpdateParams.type = payload.type;
        subUpdateParams.userType = payload.type;
    }
    batch.update(orgUserRef, subUpdateParams);

    // 2. Update Global User Document
    const userRef = db.collection("users").doc(id);
    const userUpdateParams: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp()
    };
    if (isActive !== undefined) userUpdateParams.isActive = isActive;
    if (payload.type) {
        userUpdateParams.type = payload.type;
        userUpdateParams.userType = payload.type;
    }
    if (newClaims) {
        userUpdateParams.claims = newClaims;
    }
    batch.set(userRef, userUpdateParams, { merge: true });

    await batch.commit();

    if (newClaims) {
        await admin.auth().setCustomUserClaims(id, newClaims);
    }

    return {
        status: "success",
        message: "Organization user updated successfully.",
        data: { id, orgId }
    };
}
