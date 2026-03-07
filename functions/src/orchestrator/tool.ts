import { getFirestore } from "firebase-admin/firestore";

import { getApp } from "firebase-admin/app";
const firestore = getFirestore(getApp(), "standlo");
import { randomUUID } from "crypto";

export async function createToolEntity(uid: string, payload: Record<string, unknown>) {
    const toolId = payload.id as string || randomUUID();
    const now = new Date().toISOString();

    const toolData = {
        id: toolId,
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

    await firestore.collection("tools").doc(toolId).set(toolData);

    return {
        status: "success",
        message: "Tool document created successfully.",
        data: { id: toolId }
    };
}

export async function updateToolEntity(uid: string, toolId: string, payload: Record<string, unknown>) {
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...restPayload } = payload;

    const updateData = {
        ...restPayload,
        updatedAt: now,
        updatedBy: uid
    };

    await firestore.collection("tools").doc(toolId).update(updateData);

    return {
        status: "success",
        message: "Tool document updated successfully.",
        data: { id: toolId }
    };
}

export async function deleteToolEntity(uid: string, toolId: string) {
    await firestore.collection("tools").doc(toolId).delete();

    return {
        status: "success",
        message: "Tool document deleted successfully.",
        data: { id: toolId }
    };
}
