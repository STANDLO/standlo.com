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
        // Recursively remove empty strings and nulls from the payload so Zod treats them as undefined/optional
        const sanitizePayload = (obj: any): any => {
            if (obj === null || obj === undefined || obj === "") return undefined;
            if (Array.isArray(obj)) return obj.map(sanitizePayload).filter(x => x !== undefined);
            if (typeof obj === "object") {
                const cleaned: any = {};
                for (const [key, val] of Object.entries(obj)) {
                    const cleanedVal = sanitizePayload(val);
                    if (cleanedVal !== undefined) cleaned[key] = cleanedVal;
                }
                return Object.keys(cleaned).length > 0 ? cleaned : undefined;
            }
            return obj;
        };

        const cleanedOrgData = sanitizePayload(orgData) || {};
        const parsedData = OrganizationSchema.partial().parse(cleanedOrgData);

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

        // Estrapolazione Country Code dalla P.IVA (es. "IT123456789" -> "IT")
        const countryCode = parsedData.vatNumber && parsedData.vatNumber.length >= 2
            ? parsedData.vatNumber.substring(0, 2).toUpperCase()
            : null;

        if (role === "provider") {
            const warehouseId = db.collection(`organizations/${orgRootId}/warehouses`).doc().id;
            const locationPrefix = countryCode && parsedData.place?.zipCode
                ? `${countryCode}-${parsedData.place.zipCode}`
                : "UNKNOWN";
            const vatStr = parsedData.vatNumber || "NO-VAT";

            const warehouseRef = db.collection(`organizations/${orgRootId}/warehouses`).doc(warehouseId);
            batch.set(warehouseRef, {
                code: `${locationPrefix}-${vatStr}`,
                name: parsedData.name || "Default Headquarter",
                type: "headquarter",
                place: parsedData.place || null, // Updated to use the new object structure instead of a stringified 'address'
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: uid,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: uid,
            });

            // Set the new warehouse as the headquarter on the organization record
            batch.update(orgRef, { headquarterId: warehouseId });
        }

        // 5. Upgrade Custom Claims via Admin SDK
        const newClaims: Record<string, unknown> = {
            ...currentCustomClaims,
            role: role || "pending",
            onboarding: true,
            orgId: orgRootId,
            orgName: parsedData.name || null,
            logoUrl: parsedData.logoUrl || null,
        };

        // Note: countryCode is evaluated earlier in this method

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
                const zodErrors = (error as { errors?: unknown }).errors;
                console.error("[Orchestrator][onboardOrganization] Zod Validation Issues:", JSON.stringify(zodErrors, null, 2));
                throw new HttpsError("invalid-argument", "Organization schema validation failed.", zodErrors);
            }
            throw new HttpsError("internal", error.message || "An internal error occurred during onboarding.");
        }
        throw new HttpsError("internal", "An unknown error occurred during onboarding.");
    }
}
