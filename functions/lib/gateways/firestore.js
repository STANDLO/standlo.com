"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firestore = void 0;
const https_1 = require("firebase-functions/v2/https");
const entityRegistry_1 = require("./entityRegistry");
const firestore_1 = require("firebase-admin/firestore");
const admin = __importStar(require("firebase-admin"));
exports.firestore = (0, https_1.onCall)({
    region: "europe-west4",
    enforceAppCheck: true,
    consumeAppCheckToken: false,
}, async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated to access Firestore gateway.");
    }
    const db = (0, firestore_1.getFirestore)();
    const data = request.data;
    const { correlationId, idempotencyKey, orgId, entityId, actionId, payload, limit, cursor, orderBy, filters } = data;
    console.log(`[Firestore][${correlationId || 'no-corr-id'}] Action: ${actionId} | Entity: ${entityId} | User: ${request.auth.uid}`);
    if (!entityId) {
        throw new https_1.HttpsError("invalid-argument", "EntityId is required.");
    }
    const path = (0, entityRegistry_1.buildCollectionPath)(entityId, orgId);
    const config = (0, entityRegistry_1.getEntityConfig)(entityId);
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
                data: (_a = lockSnap.data()) === null || _a === void 0 ? void 0 : _a.result,
                cached: true
            };
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let resultData;
    try {
        switch (actionId) {
            case "list": {
                let query = collectionRef;
                if (filters && Array.isArray(filters)) {
                    filters.forEach(f => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        query = query.where(f.field, f.op, f.value);
                    });
                }
                // By default, exclude soft-deleted items unless explicitly requested
                const hasDeletedFilter = filters === null || filters === void 0 ? void 0 : filters.find(f => f.field === 'deletedAt');
                if (!hasDeletedFilter) {
                    query = query.where('deletedAt', '==', null);
                }
                // By default, exclude archived items unless explicitly requested
                const hasArchivedFilter = filters === null || filters === void 0 ? void 0 : filters.find(f => f.field === 'isArchived');
                if (!hasArchivedFilter) {
                    query = query.where('isArchived', '==', false);
                }
                if (orderBy && Array.isArray(orderBy)) {
                    orderBy.forEach(o => {
                        query = query.orderBy(o.field, o.direction);
                    });
                }
                else {
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
                resultData = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
                break;
            }
            case "read": {
                if (!(payload === null || payload === void 0 ? void 0 : payload.id) || typeof payload.id !== "string") {
                    throw new https_1.HttpsError("invalid-argument", "Read requires an 'id' string inside payload.");
                }
                const docSnap = await collectionRef.doc(payload.id).get();
                if (!docSnap.exists)
                    throw new https_1.HttpsError("not-found", "Document not found.");
                resultData = Object.assign({ id: docSnap.id }, docSnap.data());
                break;
            }
            case "create": {
                if (!payload)
                    throw new https_1.HttpsError("invalid-argument", "Create requires a payload.");
                const parsedResult = config.schema.safeParse(payload);
                if (!parsedResult.success) {
                    throw new https_1.HttpsError("invalid-argument", `Zod validation failed: ${JSON.stringify(parsedResult.error.issues)}`);
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
                        userId: request.auth.uid,
                        correlationId,
                        submittedPayload: payload,
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
                const newRef = collectionRef.doc();
                const now = admin.firestore.FieldValue.serverTimestamp();
                const docData = Object.assign(Object.assign({}, parsedResult.data), { orgId: orgId || null, createdBy: request.auth.uid, createdAt: now, updatedAt: now, deletedAt: null, isArchived: false });
                await newRef.set(docData);
                resultData = Object.assign({ id: newRef.id }, docData);
                break;
            }
            case "update": {
                if (!payload || !payload.id || typeof payload.id !== 'string') {
                    throw new https_1.HttpsError("invalid-argument", "Update requires payload details including an 'id'.");
                }
                // Allow partial updates for existing fields
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const partialSchema = config.schema.partial ? config.schema.partial() : config.schema;
                const parsedResult = partialSchema.safeParse(payload);
                if (!parsedResult.success) {
                    throw new https_1.HttpsError("invalid-argument", `Zod validation failed: ${JSON.stringify(parsedResult.error.issues)}`);
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const _b = parsedResult.data, { id } = _b, updateData = __rest(_b, ["id"]);
                const payloadKeysLen = Object.keys(payload).filter(k => k !== 'id').length;
                const parsedKeysLen = Object.keys(updateData).length;
                if (payloadKeysLen !== parsedKeysLen) {
                    await db.collection("alerts").add({
                        type: "schema_mismatch",
                        action: "update",
                        entityId,
                        documentId: id,
                        userId: request.auth.uid,
                        correlationId,
                        submittedPayload: payload,
                        timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
                updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
                updateData.updatedBy = request.auth.uid;
                const docRef = collectionRef.doc(id);
                await docRef.update(updateData);
                resultData = Object.assign({ id }, updateData);
                break;
            }
            case "soft_delete": {
                if (!(payload === null || payload === void 0 ? void 0 : payload.id) || typeof payload.id !== "string") {
                    throw new https_1.HttpsError("invalid-argument", "Soft delete requires an 'id' inside payload.");
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
                throw new https_1.HttpsError("unimplemented", `Action ${actionId} not supported.`);
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
    }
    catch (error) {
        console.error(`[FirestoreGateway] Error processing ${actionId}:`, error);
        throw new https_1.HttpsError("internal", error.message || "Database operation failed.");
    }
});
//# sourceMappingURL=firestore.js.map