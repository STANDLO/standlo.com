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
exports.createPartEntity = createPartEntity;
exports.updatePartEntity = updatePartEntity;
exports.deletePartEntity = deletePartEntity;
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const firestore = (0, firestore_1.getFirestore)((0, app_1.getApp)(), "standlo");
const crypto_1 = require("crypto");
async function createPartEntity(uid, payload) {
    const partId = payload.id || (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const partData = Object.assign(Object.assign({ id: partId, orgId: payload.orgId || null, ownId: uid }, payload), { createdAt: now, createdBy: uid, updatedAt: now, updatedBy: uid, deletedAt: null, isArchived: false });
    const canvasData = {
        id: partId,
        orgId: payload.orgId || null,
        ownId: uid,
        name: payload.name || "Untitled Part",
        type: "part",
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid
    };
    // Dual creation in parallel
    await Promise.all([
        firestore.collection("parts").doc(partId).set(partData),
        firestore.collection("canvas").doc(partId).set(canvasData)
    ]);
    return {
        status: "success",
        message: "Part and Canvas document created successfully.",
        data: { id: partId }
    };
}
async function updatePartEntity(uid, partId, payload) {
    const now = new Date().toISOString();
    // Remove id from payload so we don't accidentally overwrite it
    const { id } = payload, restPayload = __rest(payload, ["id"]);
    const updateData = Object.assign(Object.assign({}, restPayload), { updatedAt: now, updatedBy: uid });
    const canvasUpdateData = {
        updatedAt: now,
        updatedBy: uid
    };
    if (payload.name)
        canvasUpdateData.name = payload.name;
    // Don't override id or type
    await Promise.all([
        firestore.collection("parts").doc(partId).update(updateData),
        firestore.collection("canvas").doc(partId).update(canvasUpdateData)
    ]);
    return {
        status: "success",
        message: "Part and Canvas document updated successfully.",
        data: { id: partId }
    };
}
async function deletePartEntity(uid, partId) {
    await Promise.all([
        firestore.collection("parts").doc(partId).delete(),
        firestore.collection("canvas").doc(partId).delete()
    ]);
    return {
        status: "success",
        message: "Part and Canvas document deleted successfully.",
        data: { id: partId }
    };
}
//# sourceMappingURL=part.js.map