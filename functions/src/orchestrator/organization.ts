import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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
        const sanitizePayload = (obj: unknown): unknown => {
            if (obj === null || obj === undefined || obj === "") return undefined;
            if (Array.isArray(obj)) return obj.map(sanitizePayload).filter(x => x !== undefined);
            if (typeof obj === "object") {
                const cleaned: Record<string, unknown> = {};
                for (const [key, val] of Object.entries(obj)) {
                    const cleanedVal = sanitizePayload(val);
                    if (cleanedVal !== undefined) cleaned[key] = cleanedVal;
                }
                return Object.keys(cleaned).length > 0 ? cleaned : undefined;
            }
            return obj;
        };

        const cleanedOrgData = (sanitizePayload(orgData) || {}) as Record<string, unknown>;

        let birthdayValue: string | null = null;
        if (cleanedOrgData["birthday"]) {
            birthdayValue = cleanedOrgData["birthday"] as string;

            // Validate Age (must be 16+)
            const birthDate = new Date(birthdayValue as string);
            if (isNaN(birthDate.getTime())) {
                throw new HttpsError("invalid-argument", "Data di nascita non valida.");
            }
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 16) {
                throw new HttpsError("invalid-argument", "Devi avere almeno 16 anni per registrarti.", { internalCode: "age_under_16" });
            }

            delete cleanedOrgData["birthday"];
        }

        // If 'type' is a single string (as submitted by the default frontend select field), wrap it in an array to pass Zod schema.
        if (typeof cleanedOrgData["type"] === "string") {
            cleanedOrgData["type"] = [cleanedOrgData["type"]];
        }

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

        // Estrapolazione Country Code dalla P.IVA (es. "IT123456789" -> "IT")
        const countryCode = parsedData.vatNumber && parsedData.vatNumber.length >= 2
            ? parsedData.vatNumber.substring(0, 2).toUpperCase()
            : null;

        let locationString: string | null = null;
        if (countryCode && parsedData.place?.zipCode) {
            locationString = `${countryCode}-${parsedData.place.zipCode}`;
        }

        // Organization Document
        const orgRef = db.collection("organizations").doc(orgRootId);
        batch.set(orgRef, {
            ...sanitizedData,
            active: isActive,
            createdAt: FieldValue.serverTimestamp(),
            createdBy: uid,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: uid,
            location: locationString,
        }, { merge: true });

        // Update User Document
        const userRef = db.collection("users").doc(uid);
        const userUpdatePayload: Record<string, unknown> = {
            active: isActive,
            type: "ADMIN",
            updatedAt: FieldValue.serverTimestamp(),
        };
        if (birthdayValue) {
            userUpdatePayload.birthday = birthdayValue;
        }

        const organizationType = parsedData.type && parsedData.type.length > 0 ? parsedData.type[0] : null;

        // 5. Upgrade Custom Claims via Admin SDK
        const newClaims: Record<string, unknown> = {
            ...currentCustomClaims,
            phoneNumber: userRec.phoneNumber || null,
            role: role || "pending",
            type: "ADMIN",
            userType: "ADMIN",
            organizationType: organizationType,
            onboarding: true,
            active: isActive,
            orgId: orgRootId,
            orgName: parsedData.name || null,
            logoUrl: parsedData.logoUrl || null,
        };

        // Note: countryCode is evaluated earlier in this method
        if (locationString) {
            newClaims.location = locationString;
        }

        if (role) {
            newClaims[`${role}Id`] = orgRootId;
            newClaims[`${role}Name`] = parsedData.name || null;
        }

        const sanitizedClaims = Object.fromEntries(
            Object.entries(newClaims).filter(([, v]) => v !== undefined)
        );

        userUpdatePayload.userType = "ADMIN";
        userUpdatePayload.claims = sanitizedClaims;
        batch.set(userRef, userUpdatePayload, { merge: true });

        await batch.commit();

        await admin.auth().setCustomUserClaims(uid, sanitizedClaims);

        // Generate Custom Token to synchronize client Edge cookies instantly
        const customToken = await admin.auth().createCustomToken(uid, sanitizedClaims);

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

export async function updateOrganizationEntity(uid: string, orgId: string, payload: Record<string, unknown>) {
    const db = getFirestore(admin.app(), "standlo");
    const now = new Date().toISOString();
    const restPayload = { ...payload };
    delete restPayload.id;

    const updateData = {
        ...restPayload,
        updatedAt: now,
        updatedBy: uid
    };

    await db.collection("organizations").doc(orgId).update(updateData);

    return {
        status: "success",
        message: "Organization updated successfully.",
        data: { id: orgId }
    };
}
