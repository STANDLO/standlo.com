import { randomUUID } from "crypto";

export async function createGenericEntity(entityId: string, uid: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const newId = (payload.id as string) || randomUUID();

    const req = createInternalRequest({
        actionId: "create",
        entityId: entityId,
        payload: {
            ...payload,
            documentId: newId,
            id: newId,
            ownId: uid,
            isArchived: false
        }
    }, uid);

    await firestore.run(req);

    const { buildCollectionPath } = await import("../gateways/entityRegistry");
    const collectionPath = buildCollectionPath(entityId, payload.orgId as string);

    return {
        status: "success",
        data: {
            id: newId,
            path: `${collectionPath}/${newId}`
        }
    };
}

export async function updateGenericEntity(entityId: string, uid: string, docId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const restPayload = { ...payload };
    delete restPayload.id;

    const req = createInternalRequest({
        actionId: "update",
        entityId: entityId,
        payload: {
            ...restPayload,
            documentId: docId
        }
    }, uid);

    await firestore.run(req);

    const { buildCollectionPath } = await import("../gateways/entityRegistry");
    const collectionPath = buildCollectionPath(entityId, payload.orgId as string);

    return {
        status: "success",
        data: {
            id: docId,
            path: `${collectionPath}/${docId}`
        }
    };
}

export async function deleteGenericEntity(entityId: string, uid: string, docId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const req = createInternalRequest({
        actionId: "delete",
        entityId: entityId,
        payload: { documentId: docId }
    }, uid);

    await firestore.run(req);

    const { buildCollectionPath } = await import("../gateways/entityRegistry");
    const collectionPath = buildCollectionPath(entityId, payload.orgId as string);

    return {
        status: "success",
        data: {
            id: docId,
            path: `${collectionPath}/${docId}`
        }
    };
}
