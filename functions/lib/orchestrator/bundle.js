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
exports.getBundleDetailsEntity = getBundleDetailsEntity;
exports.createBundleEntity = createBundleEntity;
exports.updateBundleEntity = updateBundleEntity;
exports.deleteBundleEntity = deleteBundleEntity;
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const firestore = (0, firestore_1.getFirestore)((0, app_1.getApp)(), "standlo");
const crypto_1 = require("crypto");
async function getBundleDetailsEntity(uid, bundleId) {
    const docRef = firestore.collection("bundles").doc(bundleId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        throw new Error("Bundle not found");
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
async function syncSubcollection(batch, parentRef, collectionName, 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
items, uid, now) {
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
async function createBundleEntity(uid, payload) {
    const bundleId = payload.id || (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const { parts, processes } = payload, corePayload = __rest(payload, ["parts", "processes"]);
    const bundleData = Object.assign(Object.assign({ id: bundleId, orgId: payload.orgId || null, ownId: uid }, corePayload), { createdAt: now, createdBy: uid, updatedAt: now, updatedBy: uid, deletedAt: null, isArchived: false });
    const canvasData = {
        id: bundleId,
        orgId: payload.orgId || null,
        ownId: uid,
        name: payload.name || "Untitled Bundle",
        type: "bundle",
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid
    };
    const batch = firestore.batch();
    const parentRef = firestore.collection("bundles").doc(bundleId);
    batch.set(parentRef, bundleData);
    batch.set(firestore.collection("canvas").doc(bundleId), canvasData);
    if (Array.isArray(parts)) {
        await syncSubcollection(batch, parentRef, "parts", parts, uid, now);
    }
    if (Array.isArray(processes)) {
        await syncSubcollection(batch, parentRef, "processes", processes, uid, now);
    }
    await batch.commit();
    return {
        status: "success",
        message: "Bundle and Canvas document created successfully.",
        data: { id: bundleId }
    };
}
async function updateBundleEntity(uid, bundleId, payload) {
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
    const parentRef = firestore.collection("bundles").doc(bundleId);
    // Clean undefined to avoid update issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batch.update(parentRef, updateData);
    batch.update(firestore.collection("canvas").doc(bundleId), canvasUpdateData);
    if (Array.isArray(parts)) {
        await syncSubcollection(batch, parentRef, "parts", parts, uid, now);
    }
    if (Array.isArray(processes)) {
        await syncSubcollection(batch, parentRef, "processes", processes, uid, now);
    }
    await batch.commit();
    return {
        status: "success",
        message: "Bundle and Canvas document updated successfully.",
        data: { id: bundleId }
    };
}
async function deleteBundleEntity(uid, bundleId) {
    // Note: deleting subcollections recursively should ideally be done by a background function or looping
    await Promise.all([
        firestore.collection("bundles").doc(bundleId).delete(),
        firestore.collection("canvas").doc(bundleId).delete()
    ]);
    return {
        status: "success",
        message: "Bundle and Canvas document deleted successfully.",
        data: { id: bundleId }
    };
}
//# sourceMappingURL=bundle.js.map