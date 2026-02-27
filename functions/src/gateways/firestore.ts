import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GatewayRequest } from "../types";
import { buildCollectionPath, getEntityConfig } from "./entityRegistry";
import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

export const firestore = onCall({
    region: "europe-west4",
    enforceAppCheck: true,
    consumeAppCheckToken: false,
}, async (request) => {
    const errorReferenceCode = crypto.randomUUID();
    let entityIdStr = "unknown";
    let actionIdStr = "unknown";
    let orgIdStr = "unknown";

    try {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated to access Firestore gateway.");
        }

        const db = getFirestore();
        const data = request.data as GatewayRequest;
        const { correlationId, idempotencyKey, orgId, entityId, actionId, payload, limit, cursor, orderBy, filters } = data;

        entityIdStr = entityId || "unknown";
        actionIdStr = actionId || "unknown";
        orgIdStr = orgId || "unknown";

        console.log(`[Firestore][${correlationId || 'no-corr-id'}] Action: ${actionId} | Entity: ${entityId} | User: ${request.auth.uid}`);

        if (!entityId) {
            throw new HttpsError("invalid-argument", "EntityId is required.");
        }

        const path = buildCollectionPath(entityId, orgId);
        const config = getEntityConfig(entityId);
        const collectionRef = db.collection(path);

        // 1. Idempotency Check for Write Actions
        const isWrite = ["create", "update", "soft_delete", "hard_delete"].includes(actionId);
        if (idempotencyKey && isWrite) {
            const lockRef = db.collection("idempotency_locks").doc(idempotencyKey);
            const lockSnap = await lockRef.get();
            if (lockSnap.exists) {
                console.log(`[Firestore] Idempotency lock hit for key: ${idempotencyKey}`);
                return {
                    status: "success",
                    actionId,
                    data: lockSnap.data()?.result,
                    cached: true
                };
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let resultData: any;

        switch (actionId) {
            case "list": {
                let query: admin.firestore.Query = collectionRef;

                if (filters && Array.isArray(filters)) {
                    filters.forEach(f => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        query = query.where(f.field, f.op as any, f.value);
                    });
                }

                // By default, exclude soft-deleted items unless explicitly requested
                const hasDeletedFilter = filters?.find(f => f.field === 'deletedAt');
                if (!hasDeletedFilter) {
                    query = query.where('deletedAt', '==', null);
                }

                // By default, exclude archived items unless explicitly requested
                const hasArchivedFilter = filters?.find(f => f.field === 'isArchived');
                if (!hasArchivedFilter) {
                    query = query.where('isArchived', '==', false);
                }

                if (orderBy && Array.isArray(orderBy)) {
                    orderBy.forEach(o => {
                        query = query.orderBy(o.field, o.direction);
                    });
                } else {
                    query = query.orderBy('createdAt', 'desc');
                }

                query = query.limit(limit || 50);

                if (cursor) {
                    const cursorDoc = await collectionRef.doc(cursor).get();
                    if (cursorDoc.exists) {
                        query = query.startAfter(cursorDoc);
                    }
                }

                const snapshot = await query.get();
                resultData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                break;
            }
            case "read": {
                if (!payload?.id || typeof payload.id !== "string") {
                    throw new HttpsError("invalid-argument", "Read requires an 'id' string inside payload.");
                }
                const docSnap = await collectionRef.doc(payload.id).get();
                if (!docSnap.exists) throw new HttpsError("not-found", "Document not found.");
                resultData = { id: docSnap.id, ...docSnap.data() };
                break;
            }
            case "create": {
                if (!payload) throw new HttpsError("invalid-argument", "Create requires a payload.");

                const parsedResult = config.schema.safeParse(payload);
                if (!parsedResult.success) {
                    throw new HttpsError("invalid-argument", `Zod validation failed: ${JSON.stringify(parsedResult.error.issues)}`);
                }

                // Security Alert: Mismatch between submitted data and Zod schema
                const payloadKeysLen = Object.keys(payload).length;
                const parsedKeysLen = Object.keys(parsedResult.data).length;
                if (payloadKeysLen !== parsedKeysLen) {
                    console.warn(`[SecurityAlert] Extra fields stripped during Create on ${entityId}`);
                    await db.collection("alerts").add({
                        type: "schema_mismatch",
                        action: "create",
                        entityId,
                        uid: request.auth.uid,
                        payload: JSON.stringify(payload),
                        errorMessage: "Extra fields stripped during Create",
                        errorReferenceCode: crypto.randomUUID(),
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        createdBy: request.auth.uid,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedBy: request.auth.uid,
                        isArchived: false
                    });
                }

                const newRef = collectionRef.doc();
                const now = admin.firestore.FieldValue.serverTimestamp();
                const docData = {
                    ...parsedResult.data, // Strictly validated data
                    orgId: orgId || null,
                    createdBy: request.auth.uid,
                    createdAt: now,
                    updatedAt: now,
                    deletedAt: null,
                    isArchived: false,
                };

                await newRef.set(docData);
                resultData = { id: newRef.id, ...docData };
                break;
            }
            case "update": {
                if (!payload || !payload.id || typeof payload.id !== 'string') {
                    throw new HttpsError("invalid-argument", "Update requires payload details including an 'id'.");
                }

                // Allow partial updates for existing fields
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const partialSchema = (config.schema as any).partial ? (config.schema as any).partial() : config.schema;
                const parsedResult = partialSchema.safeParse(payload);

                if (!parsedResult.success) {
                    throw new HttpsError("invalid-argument", `Zod validation failed: ${JSON.stringify(parsedResult.error.issues)}`);
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { id, ...updateData } = parsedResult.data as any;

                const payloadKeysLen = Object.keys(payload).filter(k => k !== 'id').length;
                const parsedKeysLen = Object.keys(updateData).length;
                if (payloadKeysLen !== parsedKeysLen) {
                    await db.collection("alerts").add({
                        type: "schema_mismatch",
                        action: "update",
                        entityId,
                        uid: request.auth.uid,
                        payload: JSON.stringify(payload),
                        errorMessage: "Extra fields stripped during Update",
                        errorReferenceCode: crypto.randomUUID(),
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                        createdBy: request.auth.uid,
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedBy: request.auth.uid,
                        isArchived: false
                    });
                }

                updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
                updateData.updatedBy = request.auth.uid;

                const docRef = collectionRef.doc(id);
                await docRef.update(updateData);
                resultData = { id, ...updateData };
                break;
            }
            case "soft_delete": {
                if (!payload?.id || typeof payload.id !== "string") {
                    throw new HttpsError("invalid-argument", "Soft delete requires an 'id' inside payload.");
                }
                const docRef = collectionRef.doc(payload.id);
                await docRef.update({
                    deletedAt: admin.firestore.FieldValue.serverTimestamp(),
                    deletedBy: request.auth.uid,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                resultData = { id: payload.id, softDeleted: true };
                break;
            }
            default:
                throw new HttpsError("unimplemented", `Action ${actionId} not supported.`);
        }

        // 2. Save the result to Idempotency collection if it was a write
        if (idempotencyKey && isWrite) {
            await db.collection("idempotency_locks").doc(idempotencyKey).set({
                actionId,
                entityId,
                correlationId,
                userId: request.auth.uid,
                result: resultData,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        return {
            status: "success",
            actionId,
            data: resultData
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`[FirestoreGateway][${errorReferenceCode}] Error processing request:`, error);

        try {
            const db = getFirestore();
            await db.collection("alerts").add({
                type: "system",
                action: actionIdStr,
                entityId: entityIdStr,
                orgId: orgIdStr === "unknown" ? null : orgIdStr,
                uid: request.auth?.uid || "unauthenticated",
                email: request.auth?.token?.email || null,
                roleId: request.auth?.token?.roleId || "unknown",
                payload: JSON.stringify(request.data?.payload || {}),
                errorMessage: error.message || String(error),
                errorReferenceCode,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: request.auth?.uid || "system",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedBy: request.auth?.uid || "system",
                isArchived: false
            });
        } catch (logError) {
            console.error(`[FirestoreGateway][${errorReferenceCode}] Failed to save security alert:`, logError);
        }

        // Throw sanitized error to frontend with reference code
        const status = error instanceof HttpsError ? error.code : "invalid-argument";
        throw new HttpsError(status, `Richiesta non valida o permessi insufficienti. Riferimento errore: ${errorReferenceCode}`);
    }
});
