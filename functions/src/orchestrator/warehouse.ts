import { randomUUID } from "crypto";

export async function createWarehouseEntity(uid: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const warehouseId = payload.id as string || randomUUID();

    const dbData = {
        id: warehouseId,
        orgId: payload.orgId || null,
        ownId: uid,
        ...payload,
        isArchived: false
    };

    const req = createInternalRequest({
        actionId: "create",
        entityId: "warehouse",
        payload: { ...dbData, documentId: warehouseId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Warehouse created successfully.",
        data: { id: warehouseId }
    };
}

export async function updateWarehouseEntity(uid: string, warehouseId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const restPayload = { ...payload };
    delete restPayload.id;

    const updateData = { ...restPayload };

    const req = createInternalRequest({
        actionId: "update",
        entityId: "warehouse",
        payload: { ...updateData, documentId: warehouseId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Warehouse updated successfully.",
        data: { id: warehouseId }
    };
}

export async function deleteWarehouseEntity(uid: string, warehouseId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const req = createInternalRequest({
        actionId: "delete",
        entityId: "warehouse",
        payload: { documentId: warehouseId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Warehouse deleted successfully.",
        data: { id: warehouseId }
    };
}
