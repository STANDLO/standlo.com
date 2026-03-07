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
exports.getStandDetailsEntity = getStandDetailsEntity;
exports.createStandEntity = createStandEntity;
exports.updateStandEntity = updateStandEntity;
exports.deleteStandEntity = deleteStandEntity;
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const firestore = (0, firestore_1.getFirestore)((0, app_1.getApp)(), "standlo");
const crypto_1 = require("crypto");
async function getStandDetailsEntity(uid, standId) {
    const docRef = firestore.collection("stands").doc(standId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        throw new Error("Stand not found");
    }
    const data = docSnap.data();
    const partsSnap = await docRef.collection("parts").get();
    const parts = partsSnap.docs.map(d => d.data());
    const processesSnap = await docRef.collection("processes").get();
    const processes = processesSnap.docs.map(d => d.data());
    const assembliesSnap = await docRef.collection("assemblies").get();
    const assemblies = assembliesSnap.docs.map(d => d.data());
    const bundlesSnap = await docRef.collection("bundles").get();
    const bundles = bundlesSnap.docs.map(d => d.data());
    return {
        status: "success",
        data: Object.assign(Object.assign({}, data), { parts,
            processes,
            assemblies,
            bundles })
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
async function createStandEntity(uid, payload) {
    const standId = payload.id || (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const { parts, processes, assemblies, bundles } = payload, corePayload = __rest(payload, ["parts", "processes", "assemblies", "bundles"]);
    const standData = Object.assign(Object.assign({ id: standId, orgId: payload.orgId || null, ownId: uid }, corePayload), { createdAt: now, createdBy: uid, updatedAt: now, updatedBy: uid, deletedAt: null, isArchived: false });
    const canvasData = {
        id: standId,
        orgId: payload.orgId || null,
        ownId: uid,
        name: payload.name || "Untitled Stand",
        type: "stand",
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid
    };
    const batch = firestore.batch();
    const parentRef = firestore.collection("stands").doc(standId);
    batch.set(parentRef, standData);
    batch.set(firestore.collection("canvas").doc(standId), canvasData);
    if (Array.isArray(parts)) {
        await syncSubcollection(batch, parentRef, "parts", parts, uid, now);
    }
    if (Array.isArray(processes)) {
        await syncSubcollection(batch, parentRef, "processes", processes, uid, now);
    }
    if (Array.isArray(assemblies)) {
        await syncSubcollection(batch, parentRef, "assemblies", assemblies, uid, now);
    }
    if (Array.isArray(bundles)) {
        await syncSubcollection(batch, parentRef, "bundles", bundles, uid, now);
    }
    await batch.commit();
    return {
        status: "success",
        message: "Stand and Canvas document created successfully.",
        data: { id: standId }
    };
}
async function updateStandEntity(uid, standId, payload) {
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, parts, processes, assemblies, bundles } = payload, restPayload = __rest(payload, ["id", "parts", "processes", "assemblies", "bundles"]);
    const updateData = Object.assign(Object.assign({}, restPayload), { updatedAt: now, updatedBy: uid });
    const canvasUpdateData = {
        updatedAt: now,
        updatedBy: uid
    };
    if (payload.name)
        canvasUpdateData.name = payload.name;
    const batch = firestore.batch();
    const parentRef = firestore.collection("stands").doc(standId);
    // Clean undefined to avoid update issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batch.update(parentRef, updateData);
    batch.update(firestore.collection("canvas").doc(standId), canvasUpdateData);
    if (Array.isArray(parts)) {
        await syncSubcollection(batch, parentRef, "parts", parts, uid, now);
    }
    if (Array.isArray(processes)) {
        await syncSubcollection(batch, parentRef, "processes", processes, uid, now);
    }
    if (Array.isArray(assemblies)) {
        await syncSubcollection(batch, parentRef, "assemblies", assemblies, uid, now);
    }
    if (Array.isArray(bundles)) {
        await syncSubcollection(batch, parentRef, "bundles", bundles, uid, now);
    }
    await batch.commit();
    return {
        status: "success",
        message: "Stand and Canvas document updated successfully.",
        data: { id: standId }
    };
}
async function deleteStandEntity(uid, standId) {
    // Note: deleting subcollections recursively should ideally be done by a background function or looping
    await Promise.all([
        firestore.collection("stands").doc(standId).delete(),
        firestore.collection("canvas").doc(standId).delete()
    ]);
    return {
        status: "success",
        message: "Stand and Canvas document deleted successfully.",
        data: { id: standId }
    };
}
//# sourceMappingURL=stand.js.map