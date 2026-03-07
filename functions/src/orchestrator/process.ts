import { getFirestore } from "firebase-admin/firestore";

import { getApp } from "firebase-admin/app";
const firestore = getFirestore(getApp(), "standlo");
import { randomUUID } from "crypto";

export async function createProcessEntity(uid: string, payload: Record<string, unknown>) {
    const processId = payload.id as string || randomUUID();
    const now = new Date().toISOString();

    const processData = {
        id: processId,
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

    await firestore.collection("processes").doc(processId).set(processData);

    return {
        status: "success",
        message: "Process document created successfully.",
        data: { id: processId }
    };
}

export async function updateProcessEntity(uid: string, processId: string, payload: Record<string, unknown>) {
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...restPayload } = payload;

    const updateData = {
        ...restPayload,
        updatedAt: now,
        updatedBy: uid
    };

    await firestore.collection("processes").doc(processId).update(updateData);

    return {
        status: "success",
        message: "Process document updated successfully.",
        data: { id: processId }
    };
}

export async function deleteProcessEntity(uid: string, processId: string) {
    await firestore.collection("processes").doc(processId).delete();

    return {
        status: "success",
        message: "Process document deleted successfully.",
        data: { id: processId }
    };
}
