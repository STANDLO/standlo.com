import { randomUUID } from "crypto";

export async function createPlaceEntity(uid: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const placeId = payload.id as string || randomUUID();

    const dbData = {
        id: placeId,
        orgId: payload.orgId || null,
        ownId: uid,
        ...payload,
        isArchived: false
    };

    const req = createInternalRequest({
        actionId: "create",
        entityId: "place",
        payload: { ...dbData, documentId: placeId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Place created successfully.",
        data: { id: placeId }
    };
}

export async function updatePlaceEntity(uid: string, placeId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const restPayload = { ...payload };
    delete restPayload.id;

    const updateData = { ...restPayload };

    const req = createInternalRequest({
        actionId: "update",
        entityId: "place",
        payload: { ...updateData, documentId: placeId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Place updated successfully.",
        data: { id: placeId }
    };
}

export async function deletePlaceEntity(uid: string, placeId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const req = createInternalRequest({
        actionId: "delete",
        entityId: "place",
        payload: { documentId: placeId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Place deleted successfully.",
        data: { id: placeId }
    };
}
