import * as admin from "firebase-admin";
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
            if (Array.isArray(obj)) {
                const arr = obj.map(sanitizePayload).filter(x => x !== undefined);
                return arr.length > 0 ? arr : undefined;
            }
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
        
        const orgRootId = uid;

        // Extract Country Code from VAT (e.g. "IT123456789" -> "IT")
        const countryCode = parsedData.vatNumber && parsedData.vatNumber.length >= 2
            ? parsedData.vatNumber.substring(0, 2).toUpperCase()
            : null;

        let locationString: string | null = null;
        if (countryCode && parsedData.place?.zipCode) {
            locationString = `${countryCode}-${parsedData.place.zipCode}`;
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

        // Prepare User Operations
        const userUpdatePayload: Record<string, unknown> = {
            documentId: uid,
            active: isActive,
            type: "ADMIN",
            userType: "ADMIN",
            claims: sanitizedClaims
        };
        if (birthdayValue) {
            userUpdatePayload.birthday = birthdayValue;
        }

        // Initialize Internal Request to firestore.run
        const { firestore } = await import("../gateways/firestore");
        const { createInternalRequest } = await import("../gateways/internal");

        const operations: Record<string, unknown>[] = [
            {
                actionId: "create",
                entityId: "organization",
                payload: {
                    ...sanitizedData,
                    documentId: orgRootId,
                    active: isActive,
                    location: locationString
                }
            },
            {
                actionId: "update",
                entityId: "user",
                payload: userUpdatePayload
            }
        ];

        const batchReq = createInternalRequest({
            actionId: "batch",
            entityId: "organization",
            payload: { operations }
        }, uid);

        await firestore.run(batchReq);

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
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const restPayload = { ...payload };
    delete restPayload.id;

    const updateData = { ...restPayload };

    const req = createInternalRequest({
        actionId: "update",
        entityId: "organization",
        payload: { ...updateData, documentId: orgId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Organization updated successfully.",
        data: { id: orgId }
    };
}
