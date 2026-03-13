import { randomUUID } from "crypto";

export async function getDesignDetailsEntity(uid: string, designId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const req = createInternalRequest({
        actionId: "read",
        entityId: "design",
        payload: { documentId: designId }
    }, uid);
    
    const docResult = await firestore.run(req);
    const data = (docResult as { data: Record<string, unknown> }).data;

    const fetchSubcollection = async (sub: string) => {
        const subReq = createInternalRequest({
            actionId: "list",
            entityId: `design/${designId}/${sub}`,
        }, uid);
        const res = await firestore.run(subReq);
        return (res as { data: Record<string, unknown>[] }).data || [];
    };

    const [parts, processes, assemblies, bundles] = await Promise.all([
        fetchSubcollection("parts"),
        fetchSubcollection("processes"),
        fetchSubcollection("assemblies"),
        fetchSubcollection("bundles")
    ]);

    return {
        status: "success",
        data: { ...data, parts, processes, assemblies, bundles }
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

export async function createDesignEntity(uid: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const designId = payload.id as string || randomUUID();
    const { parts, processes, assemblies, bundles, ...corePayload } = payload;

    const designData = {
        id: designId,
        orgId: payload.orgId || null,
        ...corePayload,
        isArchived: false
    };

    const canvasData = {
        id: designId,
        orgId: payload.orgId || null,
        name: payload.name || "Untitled Design",
        type: payload.type || "stand"
    };

    const operations: Record<string, unknown>[] = [
        { actionId: "create", entityId: "design", payload: { ...designData, documentId: designId } },
        { actionId: "create", entityId: "canvas", payload: { ...canvasData, documentId: designId } }
    ];

    if (Array.isArray(parts)) await generateSyncSubcollectionOperations(operations, `design/${designId}/parts`, parts, uid);
    if (Array.isArray(processes)) await generateSyncSubcollectionOperations(operations, `design/${designId}/processes`, processes, uid);
    if (Array.isArray(assemblies)) await generateSyncSubcollectionOperations(operations, `design/${designId}/assemblies`, assemblies, uid);
    if (Array.isArray(bundles)) await generateSyncSubcollectionOperations(operations, `design/${designId}/bundles`, bundles, uid);

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "design",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Design and Canvas document created successfully.",
        data: { id: designId }
    };
}

export async function updateDesignEntity(uid: string, designId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const { parts, processes, assemblies, bundles, ...restPayload } = payload;
    delete restPayload.id;

    const updateData = { ...restPayload };

    const canvasUpdateData: Record<string, unknown> = {};
    if (payload.name) canvasUpdateData.name = payload.name;

    const operations: Record<string, unknown>[] = [
        { actionId: "update", entityId: "design", payload: { ...updateData, documentId: designId } }
    ];
    if (Object.keys(canvasUpdateData).length > 0) {
        operations.push({ actionId: "update", entityId: "canvas", payload: { ...canvasUpdateData, documentId: designId } });
    }

    if (Array.isArray(parts)) await generateSyncSubcollectionOperations(operations, `design/${designId}/parts`, parts, uid);
    if (Array.isArray(processes)) await generateSyncSubcollectionOperations(operations, `design/${designId}/processes`, processes, uid);
    if (Array.isArray(assemblies)) await generateSyncSubcollectionOperations(operations, `design/${designId}/assemblies`, assemblies, uid);
    if (Array.isArray(bundles)) await generateSyncSubcollectionOperations(operations, `design/${designId}/bundles`, bundles, uid);

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "design",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Design and Canvas document updated successfully.",
        data: { id: designId }
    };
}

export async function deleteDesignEntity(uid: string, designId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const operations: Record<string, unknown>[] = [
        { actionId: "delete", entityId: "design", payload: { documentId: designId } },
        { actionId: "delete", entityId: "canvas", payload: { documentId: designId } }
    ];

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "design",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Design and Canvas document deleted successfully.",
        data: { id: designId }
    };
}
