import { getFirestore } from "firebase-admin/firestore";
import { getApp } from "firebase-admin/app";
import { randomUUID } from "crypto";

const firestore = getFirestore(getApp(), "standlo");

export async function createPlaceEntity(uid: string, payload: Record<string, unknown>) {
    const placeId = payload.id as string || randomUUID();
    const now = new Date().toISOString();

    const dbData = {
        id: placeId,
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

    await firestore.collection("places").doc(placeId).set(dbData);

    return {
        status: "success",
        message: "Place created successfully.",
        data: { id: placeId }
    };
}

export async function updatePlaceEntity(uid: string, placeId: string, payload: Record<string, unknown>) {
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...restPayload } = payload;

    const updateData = {
        ...restPayload,
        updatedAt: now,
        updatedBy: uid
    };

    await firestore.collection("places").doc(placeId).update(updateData);

    return {
        status: "success",
        message: "Place updated successfully.",
        data: { id: placeId }
    };
}

export async function deletePlaceEntity(uid: string, placeId: string) {
    await firestore.collection("places").doc(placeId).delete();

    return {
        status: "success",
        message: "Place deleted successfully.",
        data: { id: placeId }
    };
}
