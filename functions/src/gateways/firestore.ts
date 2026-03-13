import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GatewayRequest } from "../types";
import { buildCollectionPath, getEntityConfig } from "./entityRegistry";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { z } from "zod";

export const firestore = onCall({
    region: "europe-west4",
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR === "true" ? false : true,
    cors: process.env.FUNCTIONS_EMULATOR === "true" ? true : ["https://standlo.com", "https://www.standlo.com"],
    consumeAppCheckToken: false,
}, async (request) => {
    const errorReferenceCode = crypto.randomUUID();
    let entityIdStr = "unknown";
    let actionIdStr = "unknown";
    let orgIdStr = "unknown";
    const startTime = Date.now();

    try {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated to access Firestore gateway.");
        }

        const db = getFirestore(admin.app(), "standlo");
        const data = request.data as GatewayRequest;
        const { correlationId, idempotencyKey, orgId, entityId, actionId, payload, limit, cursor, orderBy, filters } = data;

        // Seletion precedence: 1. Explicit payload, 2. User's Token Custom Claim
        const resolvedOrgId = orgId || request.auth.token?.orgId;

        entityIdStr = entityId || "unknown";
        actionIdStr = actionId || "unknown";
        orgIdStr = resolvedOrgId || "unknown";

        console.log(`[Firestore][${correlationId || 'no-corr-id'}] Action: ${actionId} | Entity: ${entityId} | User: ${request.auth.uid}`);

        if (!entityId) {
            throw new HttpsError("invalid-argument", "EntityId is required.");
        }

        const path = buildCollectionPath(entityId, resolvedOrgId);
        const config = getEntityConfig(entityId);
        const collectionRef = db.collection(path);

        // 1. Idempotency Check for Write Actions
        const isWrite = ["create", "update", "soft_delete", "hard_delete", "batch"].includes(actionId);
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

        let resultData: unknown;

        switch (actionId) {
            case "list": {
                let query: admin.firestore.Query = collectionRef;

                if (filters && Array.isArray(filters)) {
                    filters.forEach(f => {
                        query = query.where(f.field, f.op as admin.firestore.WhereFilterOp, f.value);
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

                query = query.limit(Math.min(limit || 50, 500));

                if (cursor) {
                    const cursorDoc = await collectionRef.doc(cursor as string).get();
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

                // Strip timestamps that might arrive as unparsed strings from the client
                // to avoid Zod schema validation mismatch (expected Date, received string).
                const clientPayload = { ...payload } as Record<string, unknown>;
                delete clientPayload.createdAt;
                delete clientPayload.updatedAt;
                delete clientPayload.deletedAt;
                delete clientPayload.endLifeTime;

                const parsedResult = config.schema.safeParse(clientPayload);
                if (!parsedResult.success) {
                    throw new HttpsError("invalid-argument", `Zod validation failed: ${JSON.stringify(parsedResult.error.issues)}`);
                }

                const parsedRecord = parsedResult.data as Record<string, unknown>;

                // Security Alert: Mismatch between submitted data and Zod schema
                const payloadKeysLen = Object.keys(clientPayload).length;
                const parsedKeysLen = Object.keys(parsedRecord).length;
                if (payloadKeysLen !== parsedKeysLen) {
                    console.warn(`[SecurityAlert] Extra fields stripped during Create on ${entityId}`);
                    try {
                        await db.collection("admin/security/alerts").add({
                            type: "schema_mismatch",
                            action: "create",
                            entityId,
                            uid: request.auth.uid,
                            payload: JSON.stringify(clientPayload),
                            errorMessage: "Extra fields stripped during Create",
                            errorReferenceCode: crypto.randomUUID(),
                            createdAt: FieldValue.serverTimestamp(),
                            createdBy: request.auth.uid,
                            updatedAt: FieldValue.serverTimestamp(),
                            updatedBy: request.auth.uid,
                            isArchived: false
                        });
                    } catch (alertError) {
                        console.warn(`[CircuitBreaker] Failed to save schema_mismatch alert for ${entityId}:`, alertError);
                    }
                }

                const providedId = parsedRecord.id || clientPayload.id;
                let newRef: admin.firestore.DocumentReference;

                if (providedId && typeof providedId === 'string') {
                    newRef = collectionRef.doc(providedId);
                    const existingSnap = await newRef.get();
                    if (existingSnap.exists) {
                        throw new HttpsError("already-exists", `Document with ID ${providedId} already exists.`);
                    }
                } else {
                    newRef = collectionRef.doc(crypto.randomUUID());
                }
                const now = FieldValue.serverTimestamp();
                const docData = {
                    ...parsedRecord, // Strictly validated data
                    orgId: resolvedOrgId || "system",
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

                // Strip timestamps that might arrive as unparsed strings from the client
                const clientPayload = { ...payload } as Record<string, unknown>;
                delete clientPayload.createdAt;
                delete clientPayload.updatedAt;
                delete clientPayload.deletedAt;
                delete clientPayload.endLifeTime;

                // Allow partial updates for existing fields
                const schemaAny = config.schema as z.ZodObject<z.ZodRawShape>;
                const partialSchema = schemaAny.partial ? schemaAny.partial() : config.schema;
                const parsedResult = partialSchema.safeParse(clientPayload);

                if (!parsedResult.success) {
                    throw new HttpsError("invalid-argument", `Zod validation failed: ${JSON.stringify(parsedResult.error.issues)}`);
                }

                const { id, ...updateData } = parsedResult.data as Record<string, unknown>;

                const payloadKeysLen = Object.keys(clientPayload).filter(k => k !== 'id').length;
                const parsedKeysLen = Object.keys(updateData).length;
                if (payloadKeysLen !== parsedKeysLen) {
                    try {
                        await db.collection("admin/security/alerts").add({
                            type: "schema_mismatch",
                            action: "update",
                            entityId,
                            uid: request.auth.uid,
                            payload: JSON.stringify(clientPayload),
                            errorMessage: "Extra fields stripped during Update",
                            errorReferenceCode: crypto.randomUUID(),
                            createdAt: FieldValue.serverTimestamp(),
                            createdBy: request.auth.uid,
                            updatedAt: FieldValue.serverTimestamp(),
                            updatedBy: request.auth.uid,
                            isArchived: false
                        });
                    } catch (alertError) {
                        console.warn(`[CircuitBreaker] Failed to save schema_mismatch alert for ${entityId}:`, alertError);
                    }
                }

                updateData.updatedAt = FieldValue.serverTimestamp();
                updateData.updatedBy = request.auth.uid;

                const docRef = collectionRef.doc(id as string);
                await docRef.update(updateData);
                resultData = { id, ...updateData };
                break;
            }
            case "soft_delete": {
                if (!payload?.id || typeof payload.id !== "string") {
                    throw new HttpsError("invalid-argument", "Soft delete requires an 'id' inside payload.");
                }

                if (entityId === "warehouse" && orgId) {
                    const orgDoc = await db.collection("organizations").doc(orgId).get();
                    if (orgDoc.exists && orgDoc.data()?.headquarterId === payload.id) {
                        throw new HttpsError("permission-denied", "Il magazzino principale (Headquarter) non può essere eliminato.");
                    }
                }

                const docRef = collectionRef.doc(payload.id);
                await docRef.update({
                    deletedAt: FieldValue.serverTimestamp(),
                    deletedBy: request.auth.uid,
                    updatedAt: FieldValue.serverTimestamp()
                });
                resultData = { id: payload.id, softDeleted: true };
                break;
            }
            case "batch": {
                if (!payload?.operations || !Array.isArray(payload.operations)) {
                    throw new HttpsError("invalid-argument", "Batch action requires 'operations' array in payload.");
                }
                if (payload.operations.length > 500) {
                    throw new HttpsError("invalid-argument", "Batch action cannot exceed 500 operations. Please chunk your requests.");
                }

                const batchWrite = db.batch();
                const now = FieldValue.serverTimestamp();
                const results: Array<Record<string, unknown>> = [];

                for (const op of payload.operations) {
                    if (typeof op !== 'object' || op === null) continue;
                    const opObj = op as Record<string, unknown>;
                    const opType = opObj.type as string;
                    const opEntityId = (opObj.entityId as string) || entityId; // Inherit if not provided
                    const opConfig = getEntityConfig(opEntityId);
                    const opCollectionPath = buildCollectionPath(opEntityId, resolvedOrgId);
                    const opCollectionRef = db.collection(opCollectionPath);

                    if (opType === "create") {
                        const opData = (opObj.data as Record<string, unknown>) || {};
                        const clientPayload = { ...opData } as Record<string, unknown>;
                        delete clientPayload.createdAt;
                        delete clientPayload.updatedAt;
                        delete clientPayload.deletedAt;
                        delete clientPayload.endLifeTime;

                        const parsedResult = opConfig.schema.safeParse(clientPayload);
                        if (!parsedResult.success) {
                            throw new HttpsError("invalid-argument", `Batch Create Zod validation failed for ${opEntityId}: ${JSON.stringify(parsedResult.error.issues)}`);
                        }
                        
                        const parsedRecord = parsedResult.data as Record<string, unknown>;
                        const providedId = parsedRecord.id || clientPayload.id;
                        let newRef: admin.firestore.DocumentReference;

                        if (providedId && typeof providedId === 'string') {
                            newRef = opCollectionRef.doc(providedId);
                        } else {
                            newRef = opCollectionRef.doc();
                            parsedRecord.id = newRef.id;
                        }

                        const payloadKeysLen = Object.keys(clientPayload).length;
                        const parsedKeysLen = Object.keys(parsedRecord).length;
                        if (payloadKeysLen !== parsedKeysLen) {
                            console.warn(`[SecurityAlert] Extra fields stripped during Batch Create on ${opEntityId}`);
                        }

                        const docData = {
                            ...parsedRecord,
                            orgId: resolvedOrgId || "system",
                            createdBy: request.auth.uid,
                            createdAt: now,
                            updatedBy: request.auth.uid,
                            updatedAt: now,
                            isArchived: false,
                            deletedAt: null
                        };
                        
                        batchWrite.set(newRef, docData);
                        results.push({ type: "create", id: newRef.id });

                    } else if (opType === "update") {
                        if (!opObj.id || typeof opObj.id !== 'string') throw new HttpsError("invalid-argument", "Batch update requires an 'id'.");
                        const docRef = opCollectionRef.doc(opObj.id);
                        
                        const opData = (opObj.data as Record<string, unknown>) || {};
                        const clientPayload = { ...opData } as Record<string, unknown>;
                        delete clientPayload.createdAt;
                        delete clientPayload.updatedAt;
                        delete clientPayload.deletedAt;
                        delete clientPayload.endLifeTime;

                        const schemaAny = opConfig.schema as z.ZodObject<z.ZodRawShape>;
                        const partialSchema = schemaAny.partial ? schemaAny.partial() : opConfig.schema;
                        const parsedResult = partialSchema.safeParse(clientPayload);

                        if (!parsedResult.success) {
                            throw new HttpsError("invalid-argument", `Batch Update Zod validation failed for ${opEntityId}: ${JSON.stringify(parsedResult.error.issues)}`);
                        }
                        
                        const parsedRecord = parsedResult.data as Record<string, unknown>;
                        const updateData = { ...parsedRecord };
                        delete updateData.id;
                        updateData.updatedAt = now;
                        updateData.updatedBy = request.auth.uid;

                        batchWrite.update(docRef, updateData);
                        results.push({ type: "update", id: opObj.id });

                    } else if (opType === "delete") {
                        if (!opObj.id || typeof opObj.id !== 'string') throw new HttpsError("invalid-argument", "Batch delete requires an 'id'.");
                        if (opEntityId === "warehouse" && orgId) {
                            const orgDoc = await db.collection("organizations").doc(orgId).get();
                            if (orgDoc.exists && orgDoc.data()?.headquarterId === opObj.id) {
                                throw new HttpsError("permission-denied", "Il magazzino principale (Headquarter) non può essere eliminato nel batch.");
                            }
                        }
                        const docRef = opCollectionRef.doc(opObj.id);
                        batchWrite.delete(docRef);
                        results.push({ type: "delete", id: opObj.id });

                    } else if (opType === "soft_delete") {
                        if (!opObj.id || typeof opObj.id !== 'string') throw new HttpsError("invalid-argument", "Batch soft_delete requires an 'id'.");
                        if (opEntityId === "warehouse" && orgId) {
                            const orgDoc = await db.collection("organizations").doc(orgId).get();
                            if (orgDoc.exists && orgDoc.data()?.headquarterId === opObj.id) {
                                throw new HttpsError("permission-denied", "Il magazzino principale (Headquarter) non può essere eliminato nel batch.");
                            }
                        }
                        const docRef = opCollectionRef.doc(opObj.id);
                        batchWrite.update(docRef, {
                            deletedAt: now,
                            deletedBy: request.auth.uid,
                            updatedAt: now
                        });
                        results.push({ type: "soft_delete", id: opObj.id });
                    } else {
                        throw new HttpsError("invalid-argument", `Unsupported batch operation type: ${opType}`);
                    }
                }

                await batchWrite.commit();
                resultData = results;
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
                createdAt: FieldValue.serverTimestamp()
            });
        }

        const duration = Date.now() - startTime;
        if (duration > 500) {
            console.warn(`[PerformanceTelemetry][${correlationId || 'no-corr-id'}] Slow query detected: ${actionId} on ${entityId} took ${duration}ms.`);
        }

        return {
            status: "success",
            actionId,
            data: resultData
        };

    } catch (error: unknown) {
        console.error(`[FirestoreGateway][${errorReferenceCode}] Error processing request:`, error);

        try {
            const db = getFirestore(admin.app(), "standlo");
            await db.collection("admin/security/alerts").add({
                type: "system",
                action: actionIdStr,
                entityId: entityIdStr,
                orgId: orgIdStr === "unknown" ? null : orgIdStr,
                uid: request.auth?.uid || "unauthenticated",
                email: request.auth?.token?.email || null,
                roleId: request.auth?.token?.roleId || "unknown",
                payload: JSON.stringify(request.data?.payload || {}),
                errorMessage: error instanceof Error ? error.message : String(error),
                errorReferenceCode,
                createdAt: FieldValue.serverTimestamp(),
                createdBy: request.auth?.uid || "system",
                updatedAt: FieldValue.serverTimestamp(),
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
