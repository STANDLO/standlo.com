import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GatewayRequest } from "../types";
import * as admin from "firebase-admin";
import { OrganizationSchema } from "../schemas";

export const orchestrator = onCall({
    region: "europe-west4",
    enforceAppCheck: true,
    consumeAppCheckToken: false,
}, async (request) => {
    // 1. Mandatory Auth check
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be authenticated to access Orchestrator.");
    }

    const data = request.data as GatewayRequest;
    const { correlationId, idempotencyKey, orgId, userId, roleId, entityId, actionId, payload } = data;

    // Log the initiation of the workflow tracing it with correlationId
    console.log(`[Orchestrator][${correlationId || 'no-corr-id'}] Action: ${actionId} on Entity: ${entityId} started by User: ${request.auth.uid}`);
    console.log(`[Orchestrator] Details: orgId=${orgId}, userId=${userId}, roleId=${roleId}, idempotencyKey=${idempotencyKey}, payload=${!!payload}`);

    // TODO: Verify idempotencyKey against Firestore 'idempotency_locks' to prevent duplicated logic execution

    // --- ROUTER START ---
    if (actionId === "onboard_organization") {
        const uid = request.auth.uid;

        // 1. Fetch user record to check current claims
        const userRecord = await admin.auth().getUser(uid);
        const currentCustomClaims = (userRecord.customClaims || {}) as Record<string, unknown>;

        // Ensure user is truly in pending state to prevent overwriting mature profiles
        if (currentCustomClaims?.role !== "pending" && currentCustomClaims?.orgId) {
            throw new HttpsError("already-exists", "User is already onboarded.");
        }

        // 2. Validate Payload against Centralized Zod Schema
        if (!payload) {
            throw new HttpsError("invalid-argument", "Payload is required for onboarding.");
        }

        const orgData = {
            name: payload.orgName || payload.fullAddress || "New Organization",
            code: `ORG-${uid}`,
            logoUrl: payload.logoUrl,
            roleId: payload.roleId || payload.role, // Handle both payload shapes
            vatNumber: payload.vatNumber,
            fullAddress: payload.fullAddress,
            address: payload.address,
            city: payload.city,
            province: payload.province,
            zipCode: payload.zipCode,
            country: payload.country,
        };

        const parsedData = OrganizationSchema.partial().parse(orgData);

        // Clean up undefined values from parsedData as Firestore rejects them
        const sanitizedData = Object.fromEntries(
            Object.entries(parsedData).filter(([, v]) => v !== undefined)
        );

        // 3. Define the actual active status
        const role = parsedData.roleId as string;
        const isActive = role === "customer";

        // 4. Initialize Firestore Batch Transaction
        const db = admin.firestore();
        const batch = db.batch();
        const orgRootId = uid;

        // Organization Document
        const orgRef = db.collection("organizations").doc(orgRootId);
        batch.set(orgRef, {
            ...sanitizedData as Record<string, unknown>,
            active: isActive,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: uid,
        }, { merge: true });

        // Update User Document
        const userRef = db.collection("users").doc(uid);
        batch.set(userRef, {
            active: isActive,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        // 5. Upgrade Custom Claims via Admin SDK
        const newClaims: Record<string, unknown> = {
            ...currentCustomClaims,
            role: role || "pending",
            onboarding: true,
            orgId: orgRootId,
            orgName: parsedData.name || null,
            logoUrl: parsedData.logoUrl || null,
        };

        if (role) {
            newClaims[`${role}Id`] = orgRootId;
            newClaims[`${role}Name`] = parsedData.name || null;
        }

        // Clean up undefined values from claims as Firestore rejects them
        const sanitizedClaims = Object.fromEntries(
            Object.entries(newClaims).filter(([, v]) => v !== undefined)
        );

        batch.update(userRef, { claims: sanitizedClaims });
        await batch.commit();

        await admin.auth().setCustomUserClaims(uid, newClaims);

        // Generate Custom Token to synchronize client Edge cookies instantly
        const customToken = await admin.auth().createCustomToken(uid);

        return {
            status: "success",
            message: "Onboarding completed successfully.",
            actionId,
            customToken
        };
    }
    // --- ROUTER END ---

    return {
        status: "success",
        message: "Orchestrator finished successfully (No operation matched)",
        actionId,
    };
});
