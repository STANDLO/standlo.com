import { randomUUID } from "crypto";

export async function createPartEntity(uid: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const partId = payload.id as string || randomUUID();

    const partData = {
        id: partId,
        orgId: payload.orgId || null,
        ...payload,
        isArchived: false
    };

    const canvasData = {
        id: partId,
        orgId: payload.orgId || null,
        name: payload.name || "Untitled Part",
        type: "part"
    };

    const operations: Record<string, unknown>[] = [
        { actionId: "create", entityId: "part", payload: { ...partData, documentId: partId } },
        { actionId: "create", entityId: "canvas", payload: { ...canvasData, documentId: partId } }
    ];

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "part",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Part and Canvas document created successfully.",
        data: { id: partId }
    };
}

export async function updatePartEntity(uid: string, partId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    // Remove id from payload so we don't accidentally overwrite it
    const updateData = { ...payload };
    delete updateData.id;

    const canvasUpdateData: Record<string, unknown> = {};
    if (payload.name) canvasUpdateData.name = payload.name;

    const operations: Record<string, unknown>[] = [
        { actionId: "update", entityId: "part", payload: { ...updateData, documentId: partId } }
    ];
    if (Object.keys(canvasUpdateData).length > 0) {
        operations.push({ actionId: "update", entityId: "canvas", payload: { ...canvasUpdateData, documentId: partId } });
    }

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "part",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Part and Canvas document updated successfully.",
        data: { id: partId }
    };
}

export async function deletePartEntity(uid: string, partId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const operations: Record<string, unknown>[] = [
        { actionId: "delete", entityId: "part", payload: { documentId: partId } },
        { actionId: "delete", entityId: "canvas", payload: { documentId: partId } }
    ];

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "part",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Part and Canvas document deleted successfully.",
        data: { id: partId }
    };
}
