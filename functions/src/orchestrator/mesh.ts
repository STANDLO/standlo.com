import { getFirestore } from "firebase-admin/firestore";

import { getApp } from "firebase-admin/app";
const firestore = getFirestore(getApp(), "standlo");
import { randomUUID } from "crypto";

export async function createMeshEntity(uid: string, payload: Record<string, unknown>) {
    const meshId = payload.id as string || randomUUID();
    const now = new Date().toISOString();

    const meshData = {
        id: meshId,
        orgId: payload.orgId || null,
        ownId: uid,
        ...payload,
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid,
        deletedAt: null,
        isArchived: false
    };

    await firestore.collection("meshes").doc(meshId).set(meshData);

    return {
        status: "success",
        message: "Mesh document created successfully.",
        data: { id: meshId }
    };
}

export async function updateMeshEntity(uid: string, meshId: string, payload: Record<string, unknown>) {
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...restPayload } = payload;

    const updateData = {
        ...restPayload,
        updatedAt: now,
        updatedBy: uid
    };

    await firestore.collection("meshes").doc(meshId).update(updateData);

    return {
        status: "success",
        message: "Mesh document updated successfully.",
        data: { id: meshId }
    };
}

export async function deleteMeshEntity(uid: string, meshId: string) {
    await firestore.collection("meshes").doc(meshId).delete();

    return {
        status: "success",
        message: "Mesh document deleted successfully.",
        data: { id: meshId }
    };
}
