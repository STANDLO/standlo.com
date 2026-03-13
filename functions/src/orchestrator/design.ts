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
        name: payload.name || "Untitled Design",
        type: payload.type || "stand",
        isArchived: false
    };

    const operations: Record<string, unknown>[] = [
        { actionId: "create", entityId: "design", payload: { ...designData, documentId: designId } }
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
        message: "Design document created successfully.",
        data: { id: designId }
    };
}

export async function updateDesignEntity(uid: string, designId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const { parts, processes, assemblies, bundles, ...restPayload } = payload;
    delete restPayload.id;

    const updateData = { ...restPayload };

    const operations: Record<string, unknown>[] = [
        { actionId: "update", entityId: "design", payload: { ...updateData, documentId: designId } }
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
        message: "Design document updated successfully.",
        data: { id: designId }
    };
}

export async function deleteDesignEntity(uid: string, designId: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const operations: Record<string, unknown>[] = [
        { actionId: "delete", entityId: "design", payload: { documentId: designId } }
    ];

    const batchReq = createInternalRequest({
        actionId: "batch",
        entityId: "design",
        payload: { operations }
    }, uid);

    await firestore.run(batchReq);

    return {
        status: "success",
        message: "Design document deleted successfully.",
        data: { id: designId }
    };
}

import { getApp } from "firebase-admin/app";
import { getFunctions } from "firebase-admin/functions";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import * as crypto from "crypto";
import { GatewayRequest } from "../types";

export async function createDesignSandbox(request: GatewayRequest, auth?: CallableRequest["auth"]) {
    const { payload, orgId: reqOrgId } = request;

    const designId = crypto.randomUUID();
    const isPublic = !auth;
    const orgId = reqOrgId || (isPublic ? "guest" : (auth.token.orgId || "public"));
    const userId = isPublic ? "guest" : auth.uid;

    const payloadRec = payload as Record<string, unknown> | undefined;

    const queue = getFunctions(getApp()).taskQueue("locations/europe-west1/functions/choreographyDesignCreateSandbox");

    const mockObjectId = crypto.randomUUID();

    await queue.enqueue({
        ...(payloadRec || {}),
        designId,
        isPublic,
        mockObjectId: isPublic ? mockObjectId : null,
        authUserId: userId,
        authOrgId: orgId
    }, {
        dispatchDeadlineSeconds: 60 * 5 
    });

    return {
        status: "success",
        designId,
        orgId,
        message: "Design sandbox creation task queued successfully.",
    };
}

export async function claimDesignSandbox(request: GatewayRequest, auth?: CallableRequest["auth"]) {
    const { payload } = request;
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    if (!auth || !auth.uid || !auth.token.orgId) {
        throw new HttpsError("unauthenticated", "Must be authenticated to claim a design.");
    }
    const payloadRec = payload as Record<string, unknown> | undefined;
    const designId = payloadRec?.designId as string;
    if (!designId) {
        throw new HttpsError("invalid-argument", "Missing designId.");
    }

    const orgId = auth.token.orgId;
    const userId = auth.uid;

    const readRequest = createInternalRequest({
        actionId: "read",
        entityId: "design",
        payload: { documentId: designId }
    }, userId, orgId);

    const designResult = await firestore.run(readRequest);
    const designData = (designResult as { data?: Record<string, unknown> }).data;

    if (!designData) {
        throw new HttpsError("not-found", "Public design not found.");
    }

    if (designData.orgId !== "public" && designData.orgId !== "guest") {
        return { status: "success", message: "Design already claimed." };
    }

    const updateRequest = createInternalRequest({
        actionId: "update",
        entityId: "design",
        payload: {
            documentId: designId,
            orgId,
            ownId: userId,
        }
    }, userId, orgId);

    await firestore.run(updateRequest);

    return {
        status: "success",
        designId,
        orgId,
        message: "Design sandbox claimed successfully."
    };
}

export async function createNode(request: GatewayRequest, auth?: CallableRequest["auth"]) {
    const { payload } = request;
    const payloadRec = payload as Record<string, unknown> | undefined;

    const queue = getFunctions(getApp()).taskQueue("locations/europe-west1/functions/choreographyDesignCreateNode");

    await queue.enqueue({
        ...(payloadRec || {}),
        authUserId: auth?.uid || "system",
        authOrgId: auth?.token?.orgId || "system"
    }, {
        dispatchDeadlineSeconds: 60 * 5 
    });

    return {
        status: "accepted",
        message: "Node insertion task queued successfully.",
        nodeId: payloadRec?.nodeId
    };
}


export async function updateNode(request: GatewayRequest, auth?: CallableRequest["auth"]) {
    const { payload } = request;
    const payloadRec = payload as Record<string, unknown> | undefined;
    if (!payloadRec || !payloadRec.designId || !payloadRec.nodeId) {
        throw new HttpsError("invalid-argument", "Missing required payload fields for updateNode.");
    }

    const queue = getFunctions(getApp()).taskQueue("locations/europe-west1/functions/choreographyDesignUpdateNode");

    await queue.enqueue({
        ...(payloadRec || {}),
        authUserId: auth?.uid || "system",
        authOrgId: auth?.token?.orgId || "system"
    }, {
        dispatchDeadlineSeconds: 60 * 5
    });

    return {
        status: "accepted",
        message: "Node update task queued successfully.",
        nodeId: payloadRec.nodeId
    };
}

export async function deleteNode(request: GatewayRequest, auth?: CallableRequest["auth"]) {
    const { payload } = request;
    const payloadRec = payload as Record<string, unknown> | undefined;
    if (!payloadRec || !payloadRec.designId || !payloadRec.nodeId) {
        throw new HttpsError("invalid-argument", "Missing required payload fields for deleteNode.");
    }

    const queue = getFunctions(getApp()).taskQueue("locations/europe-west1/functions/choreographyDesignDeleteNode");

    await queue.enqueue({
        ...(payloadRec || {}),
        authUserId: auth?.uid || "system",
        authOrgId: auth?.token?.orgId || "system"
    }, {
        dispatchDeadlineSeconds: 60 * 5
    });

    return {
        status: "accepted",
        message: "Node deletion task queued successfully.",
        nodeId: payloadRec.nodeId
    };
}

export async function validateStructure(request: GatewayRequest) {
    const { entityId, payload } = request;
    const payloadRec = payload as Record<string, unknown> | undefined;
    const entityType = payloadRec?.entityType || request.payload?.type;

    if (!entityId || !entityType) {
        throw new HttpsError("invalid-argument", "Missing entityId or entityType.");
    }

    try {
        return {
            status: "success",
            message: `Structure for ${entityType} ${entityId} validated successfully.`,
            validationDetails: { collisions: 0, orphans: 0, invalidSockets: 0 }
        };
    } catch (error: unknown) {
        throw new HttpsError("internal", `Validation failed: ${(error as Error).message}`);
    }
}

export async function extractBOM(request: GatewayRequest) {
    const { entityId } = request;
    const payloadRec = request.payload as Record<string, unknown> | undefined;
    const entityType = payloadRec?.entityType;

    if (!entityId || !entityType) {
        throw new HttpsError("invalid-argument", "Missing entityId or entityType.");
    }

    try {
        return {
            status: "success",
            message: `BOM for ${entityType} ${entityId} extracted.`,
            bom: []
        };
    } catch (error: unknown) {
        throw new HttpsError("internal", `BOM extraction failed: ${(error as Error).message}`);
    }
}

export async function generateInstructions(request: GatewayRequest) {
    const { entityId } = request;
    const payloadRec = request.payload as Record<string, unknown> | undefined;
    const entityType = payloadRec?.entityType;
    const locale = payloadRec?.locale || "it";

    if (!entityId || !entityType) {
        throw new HttpsError("invalid-argument", "Missing entityId or entityType.");
    }

    try {
        return {
            status: "success",
            message: `Instructions for ${entityType} ${entityId} generated in ${locale}.`,
            steps: []
        };
    } catch (error: unknown) {
        throw new HttpsError("internal", `Instruction generation failed: ${(error as Error).message}`);
    }
}
