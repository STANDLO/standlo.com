import { getFirestore } from "firebase-admin/firestore";

import { getApp } from "firebase-admin/app";
const firestore = getFirestore(getApp(), "standlo");
import { randomUUID } from "crypto";

export async function createPartEntity(uid: string, payload: Record<string, unknown>) {
    const partId = payload.id as string || randomUUID();
    const now = new Date().toISOString();

    const partData = {
        id: partId,
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

export async function updatePartEntity(uid: string, partId: string, payload: Record<string, unknown>) {
    const now = new Date().toISOString();

    // Remove id from payload so we don't accidentally overwrite it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...restPayload } = payload;

    const updateData = {
        ...restPayload,
        updatedAt: now,
        updatedBy: uid
    };

    const canvasUpdateData: Record<string, unknown> = {
        updatedAt: now,
        updatedBy: uid
    };
    if (payload.name) canvasUpdateData.name = payload.name;
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

export async function deletePartEntity(uid: string, partId: string) {
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

