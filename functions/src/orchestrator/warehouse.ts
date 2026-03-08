import { getFirestore } from "firebase-admin/firestore";
import { getApp } from "firebase-admin/app";
import { randomUUID } from "crypto";

const firestore = getFirestore(getApp(), "standlo");

export async function createWarehouseEntity(uid: string, payload: Record<string, unknown>) {
    const warehouseId = payload.id as string || randomUUID();
    const now = new Date().toISOString();

    const dbData = {
        id: warehouseId,
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

    await firestore.collection("warehouses").doc(warehouseId).set(dbData);

    return {
        status: "success",
        message: "Warehouse created successfully.",
        data: { id: warehouseId }
    };
}

export async function updateWarehouseEntity(uid: string, warehouseId: string, payload: Record<string, unknown>) {
    const now = new Date().toISOString();
    const { id: _id, ...restPayload } = payload;

    const updateData = {
        ...restPayload,
        updatedAt: now,
        updatedBy: uid
    };

    await firestore.collection("warehouses").doc(warehouseId).update(updateData);

    return {
        status: "success",
        message: "Warehouse updated successfully.",
        data: { id: warehouseId }
    };
}

export async function deleteWarehouseEntity(uid: string, warehouseId: string) {
    await firestore.collection("warehouses").doc(warehouseId).delete();

    return {
        status: "success",
        message: "Warehouse deleted successfully.",
        data: { id: warehouseId }
    };
}
