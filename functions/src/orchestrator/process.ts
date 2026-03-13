import { randomUUID } from "crypto";

export async function createProcessEntity(uid: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const processId = payload.id as string || randomUUID();

    const processData = {
        id: processId,
        orgId: payload.orgId || null,
        ownId: uid, // Preserving original ownId mapping
        ...payload,
        isArchived: false
    };

    const req = createInternalRequest({
        actionId: "create",
        entityId: "process",
        payload: { ...processData, documentId: processId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Process document created successfully.",
        data: { id: processId }
    };
}

export async function updateProcessEntity(uid: string, processId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...restPayload } = payload;
    const updateData = { ...restPayload };

    const req = createInternalRequest({
        actionId: "update",
        entityId: "process",
        payload: { ...updateData, documentId: processId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Process document updated successfully.",
        data: { id: processId }
    };
}

export async function deleteProcessEntity(uid: string, processId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const req = createInternalRequest({
        actionId: "delete",
        entityId: "process",
        payload: { documentId: processId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Process document deleted successfully.",
        data: { id: processId }
    };
}
