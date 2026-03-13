import { randomUUID } from "crypto";

export async function createToolEntity(uid: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const toolId = payload.id as string || randomUUID();

    const toolData = {
        id: toolId,
        orgId: payload.orgId || null,
        ownId: uid, // Preserving original ownId mapping
        ...payload,
        isArchived: false
    };

    const req = createInternalRequest({
        actionId: "create",
        entityId: "tool",
        payload: { ...toolData, documentId: toolId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Tool document created successfully.",
        data: { id: toolId }
    };
}

export async function updateToolEntity(uid: string, toolId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const updateData = { ...payload };
    delete updateData.id;

    const req = createInternalRequest({
        actionId: "update",
        entityId: "tool",
        payload: { ...updateData, documentId: toolId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Tool document updated successfully.",
        data: { id: toolId }
    };
}

export async function deleteToolEntity(uid: string, toolId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const req = createInternalRequest({
        actionId: "delete",
        entityId: "tool",
        payload: { documentId: toolId }
    }, uid);

    await firestore.run(req);

    return {
        status: "success",
        message: "Tool document deleted successfully.",
        data: { id: toolId }
    };
}
