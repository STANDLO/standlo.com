"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listEntities = listEntities;
exports.readEntity = readEntity;
const https_1 = require("firebase-functions/v2/https");
const entityRegistry_1 = require("../gateways/entityRegistry");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)((0, app_1.getApp)(), "standlo");
async function listEntities(uid, entityId, payload) {
    if (!entityId) {
        throw new https_1.HttpsError("invalid-argument", "Entity ID is required for listing entities.");
    }
    // Allow basic entity list for PDM
    const path = (0, entityRegistry_1.buildCollectionPath)(entityId, ""); // Org ID can be empty for global PDM entities
    let query = db.collection(path);
    const filters = payload === null || payload === void 0 ? void 0 : payload.filters;
    if (filters && Array.isArray(filters)) {
        filters.forEach(f => {
            query = query.where(f.field, f.op, f.value);
        });
    }
    const hasDeletedFilter = filters === null || filters === void 0 ? void 0 : filters.find(f => f.field === 'deletedAt');
    if (!hasDeletedFilter) {
        query = query.where('deletedAt', '==', null);
    }
    const hasArchivedFilter = filters === null || filters === void 0 ? void 0 : filters.find(f => f.field === 'isArchived');
    if (!hasArchivedFilter) {
        query = query.where('isArchived', '==', false);
    }
    const orderBy = payload === null || payload === void 0 ? void 0 : payload.orderBy;
    if (orderBy && Array.isArray(orderBy)) {
        orderBy.forEach(o => {
            query = query.orderBy(o.field, o.direction);
        });
    }
    else {
        query = query.orderBy('createdAt', 'desc');
    }
    query = query.limit((payload === null || payload === void 0 ? void 0 : payload.limit) || 50);
    const cursor = payload === null || payload === void 0 ? void 0 : payload.cursor;
    if (cursor) {
        const cursorDoc = await db.collection(path).doc(cursor).get();
        if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
        }
    }
    const snapshot = await query.get();
    const resultData = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    return {
        status: "success",
        data: resultData
    };
}
async function readEntity(uid, entityId, docId) {
    if (!entityId || !docId) {
        throw new https_1.HttpsError("invalid-argument", "Entity ID and Document ID are required for reading an entity.");
    }
    const path = (0, entityRegistry_1.buildCollectionPath)(entityId, "");
    const docSnap = await db.collection(path).doc(docId).get();
    if (!docSnap.exists) {
        throw new https_1.HttpsError("not-found", "Document not found.");
    }
    return {
        status: "success",
        data: Object.assign({ id: docSnap.id }, docSnap.data())
    };
}
//# sourceMappingURL=queries.js.map