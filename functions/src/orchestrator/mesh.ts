import { randomUUID } from "crypto";

export async function createMeshEntity(uid: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const meshId = payload.id as string || randomUUID();

    const meshData = {
        id: meshId,
        orgId: payload.orgId || null,
        ownId: uid, // Preserving original ownId mapping, though createInternalRequest normally handles it. We pass it through internal gateway unchanged.
        ...payload,
        isArchived: false
    };

    const req = createInternalRequest({
        actionId: "create",
        entityId: "mesh",
        payload: { ...meshData, documentId: meshId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Mesh document created successfully.",
        data: { id: meshId }
    };
}

export async function updateMeshEntity(uid: string, meshId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const updateData = { ...payload };
    delete updateData.id;

    const req = createInternalRequest({
        actionId: "update",
        entityId: "mesh",
        payload: { ...updateData, documentId: meshId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Mesh document updated successfully.",
        data: { id: meshId }
    };
}

export async function deleteMeshEntity(uid: string, meshId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const req = createInternalRequest({
        actionId: "delete",
        entityId: "mesh",
        payload: { documentId: meshId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Mesh document deleted successfully.",
        data: { id: meshId }
    };
}
