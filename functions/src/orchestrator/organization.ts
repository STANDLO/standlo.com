import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { OrganizationSchema } from "../schemas";

export async function onboardOrganization(uid: string, orgData: Record<string, unknown>) {
    const userRec = await admin.auth().getUser(uid);
    const currentCustomClaims = userRec.customClaims || {};

    if (currentCustomClaims.onboarding) {
        throw new HttpsError("already-exists", "User is already onboarded.");
    }

    if (!orgData || typeof orgData !== "object" || Object.keys(orgData).length === 0) {
        throw new HttpsError("invalid-argument", "Organization payload is missing or empty.");
    }

    try {
        const parsedData = OrganizationSchema.partial().parse(orgData);

        // Clean up undefined values from parsedData as Firestore rejects them
        const sanitizedData = Object.fromEntries(
            Object.entries(parsedData).filter(([, v]) => v !== undefined)
        );

        // 3. Define the actual active status
        const role = parsedData.roleId as string;
        const isActive = role === "customer";

        // 4. Initialize Firestore Batch Transaction (Using Named DB "standlo")
        const db = getFirestore(admin.app(), "standlo");
        const batch = db.batch();
        const orgRootId = uid;

        // Organization Document
        const orgRef = db.collection("organizations").doc(orgRootId);
        batch.set(orgRef, {
            ...sanitizedData,
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

        // Estrapolazione Country Code dalla P.IVA (es. "IT123456789" -> "IT")
        const countryCode = parsedData.vatNumber && parsedData.vatNumber.length >= 2
            ? parsedData.vatNumber.substring(0, 2).toUpperCase()
            : null;

        if (countryCode && parsedData.place?.zipCode) {
            newClaims.location = `${countryCode}-${parsedData.place.zipCode}`;
        }

        if (role) {
            newClaims[`${role}Id`] = orgRootId;
            newClaims[`${role}Name`] = parsedData.name || null;
        }

        const sanitizedClaims = Object.fromEntries(
            Object.entries(newClaims).filter(([, v]) => v !== undefined)
        );

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
    } catch (error: unknown) {
        console.error("[Orchestrator][onboardOrganization] Error:", error);
        if (error instanceof Error) {
            if (error.name === "ZodError") {
                throw new HttpsError("invalid-argument", "Organization schema validation failed.", (error as { errors?: unknown }).errors);
            }
            throw new HttpsError("internal", error.message || "An internal error occurred during onboarding.");
        }
        throw new HttpsError("internal", "An unknown error occurred during onboarding.");
    }
}
