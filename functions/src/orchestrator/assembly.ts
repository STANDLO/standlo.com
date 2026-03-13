import { randomUUID } from "crypto";

export async function getAssemblyDetailsEntity(uid: string, assemblyId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const req = createInternalRequest({
        actionId: "read",
        entityId: "assembly",
        payload: { documentId: assemblyId }
    }, uid);
    
    const docResult = await firestore.run(req);
    const data = (docResult as { data: Record<string, unknown> }).data;

    const partsReq = createInternalRequest({
        actionId: "list",
        entityId: `assembly/${assemblyId}/parts`,
    }, uid);
    const partsResult = await firestore.run(partsReq);

    const procReq = createInternalRequest({
        actionId: "list",
        entityId: `assembly/${assemblyId}/processes`,
    }, uid);
    const procResult = await firestore.run(procReq);

    return {
        status: "success",
        data: {
            ...data,
            parts: (partsResult as { data: Record<string, unknown>[] }).data,
            processes: (procResult as { data: Record<string, unknown>[] }).data
        }
    };
}

// Helper per calcolare le modifiche su sotto-collezioni ed elaborare payload in array Batch Operations
async function generateSyncSubcollectionOperations(
    operations: Record<string, unknown>[],
    entityIdStr: string,
    items: Record<string, unknown>[],
    uid: string
) {
    if (!items) return;
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const listReq = createInternalRequest({ actionId: "list", entityId: entityIdStr }, uid);
    const existingDocsRes = await firestore.run(listReq);
    const existingDocs = (existingDocsRes as { data: Record<string, unknown>[] }).data || [];
    const existingIds = new Set(existingDocs.map(d => d.id as string));

    for (const item of items) {
        const itemId = (item.id as string) || randomUUID();
        const isUpdate = existingIds.has(itemId);

        operations.push({
            actionId: isUpdate ? "update" : "create",
            entityId: entityIdStr,
            payload: { ...item, id: itemId, documentId: itemId }
        });

        if (isUpdate) existingIds.delete(itemId);
    }

    for (const idToDelete of existingIds) {
        operations.push({
            actionId: "delete",
            entityId: entityIdStr,
            payload: { documentId: idToDelete }
        });
    }
}

export async function createAssemblyEntity(uid: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const assemblyId = payload.id as string || randomUUID();
    const { parts, processes, ...corePayload } = payload;

    const assemblyData = {
        id: assemblyId,
        orgId: payload.orgId || null,
        ...corePayload,
        isArchived: false
    };

    const canvasData = {
        id: assemblyId,
        orgId: payload.orgId || null,
        name: payload.name || "Untitled Assembly",
        type: "assembly"
    };

    const operations: Record<string, unknown>[] = [
        { actionId: "create", entityId: "assembly", payload: { ...assemblyData, documentId: assemblyId } },
        { actionId: "create", entityId: "canvas", payload: { ...canvasData, documentId: assemblyId } }
    ];

    if (Array.isArray(parts)) {
        await generateSyncSubcollectionOperations(operations, `assembly/${assemblyId}/parts`, parts, uid);
    }
    if (Array.isArray(processes)) {
        await generateSyncSubcollectionOperations(operations, `assembly/${assemblyId}/processes`, processes, uid);
    }

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "assembly",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Assembly and Canvas document created successfully.",
        data: { id: assemblyId }
    };
}

export async function updateAssemblyEntity(uid: string, assemblyId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const { parts, processes, ...restPayload } = payload;
    delete restPayload.id;

    const updateData = { ...restPayload };

    const canvasUpdateData: Record<string, unknown> = {};
    if (payload.name) canvasUpdateData.name = payload.name;

    const operations: Record<string, unknown>[] = [
        { actionId: "update", entityId: "assembly", payload: { ...updateData, documentId: assemblyId } },
    ];
    if (Object.keys(canvasUpdateData).length > 0) {
        operations.push({ actionId: "update", entityId: "canvas", payload: { ...canvasUpdateData, documentId: assemblyId } });
    }

    if (Array.isArray(parts)) {
        await generateSyncSubcollectionOperations(operations, `assembly/${assemblyId}/parts`, parts, uid);
    }
    if (Array.isArray(processes)) {
        await generateSyncSubcollectionOperations(operations, `assembly/${assemblyId}/processes`, processes, uid);
    }

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "assembly",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Assembly and Canvas document updated successfully.",
        data: { id: assemblyId }
    };
}

export async function deleteAssemblyEntity(uid: string, assemblyId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const operations: Record<string, unknown>[] = [
        { actionId: "delete", entityId: "assembly", payload: { documentId: assemblyId } },
        { actionId: "delete", entityId: "canvas", payload: { documentId: assemblyId } }
    ];

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "assembly",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Assembly and Canvas document deleted successfully.",
        data: { id: assemblyId }
    };
}
