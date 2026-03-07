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
exports.createProcessEntity = createProcessEntity;
exports.updateProcessEntity = updateProcessEntity;
exports.deleteProcessEntity = deleteProcessEntity;
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const firestore = (0, firestore_1.getFirestore)((0, app_1.getApp)(), "standlo");
const crypto_1 = require("crypto");
async function createProcessEntity(uid, payload) {
    const processId = payload.id || (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const processData = Object.assign(Object.assign({ id: processId, orgId: payload.orgId || null, ownId: uid }, payload), { createdAt: now, createdBy: uid, updatedAt: now, updatedBy: uid, deletedAt: null, isArchived: false });
    await firestore.collection("processes").doc(processId).set(processData);
    return {
        status: "success",
        message: "Process document created successfully.",
        data: { id: processId }
    };
}
async function updateProcessEntity(uid, processId, payload) {
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id } = payload, restPayload = __rest(payload, ["id"]);
    const updateData = Object.assign(Object.assign({}, restPayload), { updatedAt: now, updatedBy: uid });
    await firestore.collection("processes").doc(processId).update(updateData);
    return {
        status: "success",
        message: "Process document updated successfully.",
        data: { id: processId }
    };
}
async function deleteProcessEntity(uid, processId) {
    await firestore.collection("processes").doc(processId).delete();
    return {
        status: "success",
        message: "Process document deleted successfully.",
        data: { id: processId }
    };
}
//# sourceMappingURL=process.js.map