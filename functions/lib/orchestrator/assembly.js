"use strict";
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
exports.getAssemblyDetailsEntity = getAssemblyDetailsEntity;
exports.createAssemblyEntity = createAssemblyEntity;
exports.updateAssemblyEntity = updateAssemblyEntity;
exports.deleteAssemblyEntity = deleteAssemblyEntity;
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const firestore = (0, firestore_1.getFirestore)((0, app_1.getApp)(), "standlo");
const crypto_1 = require("crypto");
async function getAssemblyDetailsEntity(uid, assemblyId) {
    const docRef = firestore.collection("assemblies").doc(assemblyId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        throw new Error("Assembly not found");
    }
    const data = docSnap.data();
    const partsSnap = await docRef.collection("parts").get();
    const parts = partsSnap.docs.map(d => d.data());
    const processesSnap = await docRef.collection("processes").get();
    const processes = processesSnap.docs.map(d => d.data());
    return {
        status: "success",
        data: Object.assign(Object.assign({}, data), { parts,
            processes })
    };
}
// Helper per sincronizzare una sotto-collezione con una batch Firestore
async function syncSubcollection(batch, parentRef, collectionName, items, uid, now) {
    if (!items)
        return;
    const existingDocs = await parentRef.collection(collectionName).get();
    const existingIds = new Set(existingDocs.docs.map(d => d.id));
    for (const item of items) {
        const itemId = item.id || (0, crypto_1.randomUUID)();
        const docRef = parentRef.collection(collectionName).doc(itemId);
        const itemData = Object.assign({}, item);
        // Clean undefined properties to prevent firestore exceptions
        Object.keys(itemData).forEach(key => itemData[key] === undefined && delete itemData[key]);
        if (existingIds.has(itemId)) {
            batch.update(docRef, Object.assign(Object.assign({}, itemData), { updatedAt: now, updatedBy: uid }));
            existingIds.delete(itemId);
        }
        else {
            batch.set(docRef, Object.assign(Object.assign({}, itemData), { id: itemId, createdAt: now, createdBy: uid, updatedAt: now, updatedBy: uid }));
        }
    }
    for (const idToDelete of existingIds) {
        batch.delete(parentRef.collection(collectionName).doc(idToDelete));
    }
}
async function createAssemblyEntity(uid, payload) {
    const assemblyId = payload.id || (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const { parts, processes } = payload, corePayload = __rest(payload, ["parts", "processes"]);
    const assemblyData = Object.assign(Object.assign({ id: assemblyId, orgId: payload.orgId || null, ownId: uid }, corePayload), { createdAt: now, createdBy: uid, updatedAt: now, updatedBy: uid, deletedAt: null, isArchived: false });
    const canvasData = {
        id: assemblyId,
        orgId: payload.orgId || null,
        ownId: uid,
        name: payload.name || "Untitled Assembly",
        type: "assembly",
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid
    };
    const batch = firestore.batch();
    const parentRef = firestore.collection("assemblies").doc(assemblyId);
    batch.set(parentRef, assemblyData);
    batch.set(firestore.collection("canvas").doc(assemblyId), canvasData);
    if (Array.isArray(parts)) {
        await syncSubcollection(batch, parentRef, "parts", parts, uid, now);
    }
    if (Array.isArray(processes)) {
        await syncSubcollection(batch, parentRef, "processes", processes, uid, now);
    }
    await batch.commit();
    return {
        status: "success",
        message: "Assembly and Canvas document created successfully.",
        data: { id: assemblyId }
    };
}
async function updateAssemblyEntity(uid, assemblyId, payload) {
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, parts, processes } = payload, restPayload = __rest(payload, ["id", "parts", "processes"]);
    const updateData = Object.assign(Object.assign({}, restPayload), { updatedAt: now, updatedBy: uid });
    const canvasUpdateData = {
        updatedAt: now,
        updatedBy: uid
    };
    if (payload.name)
        canvasUpdateData.name = payload.name;
    const batch = firestore.batch();
    const parentRef = firestore.collection("assemblies").doc(assemblyId);
    // Clean undefined to avoid update issues
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    batch.update(parentRef, updateData);
    batch.update(firestore.collection("canvas").doc(assemblyId), canvasUpdateData);
    if (Array.isArray(parts)) {
        await syncSubcollection(batch, parentRef, "parts", parts, uid, now);
    }
    if (Array.isArray(processes)) {
        await syncSubcollection(batch, parentRef, "processes", processes, uid, now);
    }
    await batch.commit();
    return {
        status: "success",
        message: "Assembly and Canvas document updated successfully.",
        data: { id: assemblyId }
    };
}
async function deleteAssemblyEntity(uid, assemblyId) {
    // Note: deleting subcollections recursively should ideally be done by a background function or looping,
    // but a top level document delete handles it partially. In production, we should recursively delete or use Callable delete recursively.
    // For now we keep the same logic.
    await Promise.all([
        firestore.collection("assemblies").doc(assemblyId).delete(),
        firestore.collection("canvas").doc(assemblyId).delete()
    ]);
    return {
        status: "success",
        message: "Assembly and Canvas document deleted successfully.",
        data: { id: assemblyId }
    };
}
//# sourceMappingURL=assembly.js.map