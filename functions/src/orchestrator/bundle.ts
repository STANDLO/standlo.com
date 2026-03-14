import { randomUUID } from "crypto";

export async function getBundleDetailsEntity(uid: string, bundleId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const req = createInternalRequest({
        actionId: "read",
        entityId: "bundle",
        payload: { documentId: bundleId }
    }, uid);
    
    const docResult = await firestore.run(req);
    const data = (docResult as { data: Record<string, unknown> }).data;

    const partsReq = createInternalRequest({
        actionId: "list",
        entityId: `bundle/${bundleId}/parts`,
    }, uid);
    const partsResult = await firestore.run(partsReq);

    const procReq = createInternalRequest({
        actionId: "list",
        entityId: `bundle/${bundleId}/processes`,
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
            type: isUpdate ? "update" : "create",
            entityId: entityIdStr,
            id: itemId,
            data: { ...item, id: itemId, documentId: itemId }
        });

        if (isUpdate) existingIds.delete(itemId);
    }

    for (const idToDelete of existingIds) {
        operations.push({
            type: "delete",
            entityId: entityIdStr,
            id: idToDelete
        });
    }
}

export async function createBundleEntity(uid: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const bundleId = payload.id as string || randomUUID();
    const { parts, processes, ...corePayload } = payload;

    const bundleData = {
        id: bundleId,
        orgId: payload.orgId || null,
        ...corePayload,
        isArchived: false
    };

    const designData = {
        id: bundleId,
        orgId: payload.orgId || null,
        name: payload.name || "Untitled Bundle",
        type: "bundle",
    };

    const operations: Record<string, unknown>[] = [
        { type: "create", entityId: "bundle", data: { ...bundleData, documentId: bundleId } },
        { type: "create", entityId: "design", data: { ...designData, documentId: bundleId } }
    ];

    if (Array.isArray(parts)) {
        await generateSyncSubcollectionOperations(operations, `bundle/${bundleId}/parts`, parts, uid);
    }
    if (Array.isArray(processes)) {
        await generateSyncSubcollectionOperations(operations, `bundle/${bundleId}/processes`, processes, uid);
    }

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "bundle",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Bundle and Design document created successfully.",
        data: { id: bundleId }
    };
}

export async function updateBundleEntity(uid: string, bundleId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const { parts, processes, ...restPayload } = payload;
    delete restPayload.id;

    const updateData = { ...restPayload };

    const designUpdateData: Record<string, unknown> = {};
    if (payload.name) designUpdateData.name = payload.name;

    const operations: Record<string, unknown>[] = [
        { type: "update", entityId: "bundle", id: bundleId, data: { ...updateData, documentId: bundleId } },
        { type: "update", entityId: "design", id: bundleId, data: { ...designUpdateData, documentId: bundleId } }
    ];

    if (Array.isArray(parts)) {
        await generateSyncSubcollectionOperations(operations, `bundle/${bundleId}/parts`, parts, uid);
    }
    if (Array.isArray(processes)) {
        await generateSyncSubcollectionOperations(operations, `bundle/${bundleId}/processes`, processes, uid);
    }

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "bundle",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Bundle and Design document updated successfully.",
        data: { id: bundleId }
    };
}

export async function deleteBundleEntity(uid: string, bundleId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const operations: Record<string, unknown>[] = [
        { type: "delete", entityId: "bundle", id: bundleId },
        { type: "delete", entityId: "design", id: bundleId }
    ];

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "bundle",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Bundle and Design document deleted successfully.",
        data: { id: bundleId }
    };
}
