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
const crypto = __importStar(require("crypto"));
exports.firestore = (0, https_1.onCall)({
    region: "europe-west4",
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR === "true" ? false : true,
    cors: process.env.FUNCTIONS_EMULATOR === "true" ? true : ["https://standlo.com", "https://www.standlo.com"],
    consumeAppCheckToken: false,
}, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const errorReferenceCode = crypto.randomUUID();
    let entityIdStr = "unknown";
    let actionIdStr = "unknown";
    let orgIdStr = "unknown";
    try {
        if (!request.auth) {
            throw new https_1.HttpsError("unauthenticated", "User must be authenticated to access Firestore gateway.");
        }
        const db = (0, firestore_1.getFirestore)(admin.app(), "standlo");
        const data = request.data;
        const { correlationId, idempotencyKey, orgId, entityId, actionId, payload, limit, cursor, orderBy, filters } = data;
        // Seletion precedence: 1. Explicit payload, 2. User's Token Custom Claim
        const resolvedOrgId = orgId || ((_a = request.auth.token) === null || _a === void 0 ? void 0 : _a.orgId);
        entityIdStr = entityId || "unknown";
        actionIdStr = actionId || "unknown";
        orgIdStr = resolvedOrgId || "unknown";
        console.log(`[Firestore][${correlationId || 'no-corr-id'}] Action: ${actionId} | Entity: ${entityId} | User: ${request.auth.uid}`);
        if (!entityId) {
            throw new https_1.HttpsError("invalid-argument", "EntityId is required.");
        }
        const path = (0, entityRegistry_1.buildCollectionPath)(entityId, resolvedOrgId);
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
                    data: (_b = lockSnap.data()) === null || _b === void 0 ? void 0 : _b.result,
                    cached: true
                };
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let resultData;
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
                // Strip timestamps that might arrive as unparsed strings from the client
                // to avoid Zod schema validation mismatch (expected Date, received string).
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { createdAt, updatedAt, deletedAt, endLifeTime } = payload, clientPayload = __rest(payload, ["createdAt", "updatedAt", "deletedAt", "endLifeTime"]);
                const parsedResult = config.schema.safeParse(clientPayload);
                if (!parsedResult.success) {
                    throw new https_1.HttpsError("invalid-argument", `Zod validation failed: ${JSON.stringify(parsedResult.error.issues)}`);
                }
                // Security Alert: Mismatch between submitted data and Zod schema
                const payloadKeysLen = Object.keys(clientPayload).length;
                const parsedKeysLen = Object.keys(parsedResult.data).length;
                if (payloadKeysLen !== parsedKeysLen) {
                    console.warn(`[SecurityAlert] Extra fields stripped during Create on ${entityId}`);
                    await db.collection("admin/security/alerts").add({
                        type: "schema_mismatch",
                        action: "create",
                        entityId,
                        uid: request.auth.uid,
                        payload: JSON.stringify(clientPayload),
                        errorMessage: "Extra fields stripped during Create",
                        errorReferenceCode: crypto.randomUUID(),
                        createdAt: firestore_1.FieldValue.serverTimestamp(),
                        createdBy: request.auth.uid,
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                        updatedBy: request.auth.uid,
                        isArchived: false
                    });
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const providedId = parsedResult.data.id || clientPayload.id;
                let newRef;
                if (providedId && typeof providedId === 'string') {
                    newRef = collectionRef.doc(providedId);
                    const existingSnap = await newRef.get();
                    if (existingSnap.exists) {
                        throw new https_1.HttpsError("already-exists", `Document with ID ${providedId} already exists.`);
                    }
                }
                else {
                    newRef = collectionRef.doc(crypto.randomUUID());
                }
                const now = firestore_1.FieldValue.serverTimestamp();
                const docData = Object.assign(Object.assign({}, parsedResult.data), { orgId: resolvedOrgId || null, createdBy: request.auth.uid, createdAt: now, updatedAt: now, deletedAt: null, isArchived: false });
                await newRef.set(docData);
                resultData = Object.assign({ id: newRef.id }, docData);
                break;
            }
            case "update": {
                if (!payload || !payload.id || typeof payload.id !== 'string') {
                    throw new https_1.HttpsError("invalid-argument", "Update requires payload details including an 'id'.");
                }
                // Strip timestamps that might arrive as unparsed strings from the client
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { createdAt, updatedAt, deletedAt, endLifeTime } = payload, clientPayload = __rest(payload, ["createdAt", "updatedAt", "deletedAt", "endLifeTime"]);
                // Allow partial updates for existing fields
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const partialSchema = config.schema.partial ? config.schema.partial() : config.schema;
                const parsedResult = partialSchema.safeParse(clientPayload);
                if (!parsedResult.success) {
                    throw new https_1.HttpsError("invalid-argument", `Zod validation failed: ${JSON.stringify(parsedResult.error.issues)}`);
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const _m = parsedResult.data, { id } = _m, updateData = __rest(_m, ["id"]);
                const payloadKeysLen = Object.keys(clientPayload).filter(k => k !== 'id').length;
                const parsedKeysLen = Object.keys(updateData).length;
                if (payloadKeysLen !== parsedKeysLen) {
                    await db.collection("admin/security/alerts").add({
                        type: "schema_mismatch",
                        action: "update",
                        entityId,
                        uid: request.auth.uid,
                        payload: JSON.stringify(clientPayload),
                        errorMessage: "Extra fields stripped during Update",
                        errorReferenceCode: crypto.randomUUID(),
                        createdAt: firestore_1.FieldValue.serverTimestamp(),
                        createdBy: request.auth.uid,
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                        updatedBy: request.auth.uid,
                        isArchived: false
                    });
                }
                updateData.updatedAt = firestore_1.FieldValue.serverTimestamp();
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
                if (entityId === "warehouse" && orgId) {
                    const orgDoc = await db.collection("organizations").doc(orgId).get();
                    if (orgDoc.exists && ((_c = orgDoc.data()) === null || _c === void 0 ? void 0 : _c.headquarterId) === payload.id) {
                        throw new https_1.HttpsError("permission-denied", "Il magazzino principale (Headquarter) non può essere eliminato.");
                    }
                }
                const docRef = collectionRef.doc(payload.id);
                await docRef.update({
                    deletedAt: firestore_1.FieldValue.serverTimestamp(),
                    deletedBy: request.auth.uid,
                    updatedAt: firestore_1.FieldValue.serverTimestamp()
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
                createdAt: firestore_1.FieldValue.serverTimestamp()
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
        console.error(`[FirestoreGateway][${errorReferenceCode}] Error processing request:`, error);
        try {
            const db = (0, firestore_1.getFirestore)(admin.app(), "standlo");
            await db.collection("admin/security/alerts").add({
                type: "system",
                action: actionIdStr,
                entityId: entityIdStr,
                orgId: orgIdStr === "unknown" ? null : orgIdStr,
                uid: ((_d = request.auth) === null || _d === void 0 ? void 0 : _d.uid) || "unauthenticated",
                email: ((_f = (_e = request.auth) === null || _e === void 0 ? void 0 : _e.token) === null || _f === void 0 ? void 0 : _f.email) || null,
                roleId: ((_h = (_g = request.auth) === null || _g === void 0 ? void 0 : _g.token) === null || _h === void 0 ? void 0 : _h.roleId) || "unknown",
                payload: JSON.stringify(((_j = request.data) === null || _j === void 0 ? void 0 : _j.payload) || {}),
                errorMessage: error.message || String(error),
                errorReferenceCode,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                createdBy: ((_k = request.auth) === null || _k === void 0 ? void 0 : _k.uid) || "system",
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
                updatedBy: ((_l = request.auth) === null || _l === void 0 ? void 0 : _l.uid) || "system",
                isArchived: false
            });
        }
        catch (logError) {
            console.error(`[FirestoreGateway][${errorReferenceCode}] Failed to save security alert:`, logError);
        }
        // Throw sanitized error to frontend with reference code
        const status = error instanceof https_1.HttpsError ? error.code : "invalid-argument";
        throw new https_1.HttpsError(status, `Richiesta non valida o permessi insufficienti. Riferimento errore: ${errorReferenceCode}`);
    }
});
//# sourceMappingURL=firestore.js.map