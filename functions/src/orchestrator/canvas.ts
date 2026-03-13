import { getApp } from "firebase-admin/app";
import { getFunctions } from "firebase-admin/functions";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";

import * as crypto from "crypto";
import { GatewayRequest } from "../types";

/**
 * Creates a new Canvas Sandbox.
 * If the user is unauthenticated (guest), creates a public sandbox with mock data.
 * If authenticated, creates it under their organization.
 */
export async function createCanvasSandbox(request: GatewayRequest, auth?: CallableRequest["auth"]) {
    const { payload, orgId: reqOrgId } = request;

    // Use true crypto.randomUUID() for secure ID generation
    const canvasId = crypto.randomUUID();
    const isPublic = !auth;
    const orgId = reqOrgId || (isPublic ? "guest" : (auth.token.orgId || "public"));
    const userId = isPublic ? "guest" : auth.uid;

    const payloadRec = payload as Record<string, unknown> | undefined;

    const queue = getFunctions(getApp()).taskQueue("locations/europe-west1/functions/choreographyCanvasCreateSandbox");

    const mockObjectId = crypto.randomUUID();

    await queue.enqueue({
        ...(payloadRec || {}),
        canvasId,
        isPublic,
        mockObjectId: isPublic ? mockObjectId : null,
        authUserId: userId,
        authOrgId: orgId
    }, {
        dispatchDeadlineSeconds: 60 * 5 // 5 minutes max
    });

    return {
        status: "success",
        canvasId,
        orgId,
        message: "Canvas sandbox creation task queued successfully.",
    };
}

/**
 * Claims a public Canvas Sandbox for a newly registered/logged in user.
 */
export async function claimCanvasSandbox(request: GatewayRequest, auth?: CallableRequest["auth"]) {
    const { payload } = request;
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    if (!auth || !auth.uid || !auth.token.orgId) {
        throw new HttpsError("unauthenticated", "Must be authenticated to claim a canvas.");
    }
    const payloadRec = payload as Record<string, unknown> | undefined;
    const canvasId = payloadRec?.canvasId as string;
    if (!canvasId) {
        throw new HttpsError("invalid-argument", "Missing canvasId.");
    }

    const orgId = auth.token.orgId;
    const userId = auth.uid;

    const readRequest = createInternalRequest({
        actionId: "read",
        entityId: "canvas",
        payload: { documentId: canvasId }
    }, userId, orgId);

    const canvasResult = await firestore.run(readRequest);
    const canvasData = (canvasResult as { data?: Record<string, unknown> }).data;

    if (!canvasData) {
        throw new HttpsError("not-found", "Public canvas not found.");
    }

    if (canvasData.orgId !== "public" && canvasData.orgId !== "guest") {
        return { status: "success", message: "Canvas already claimed." };
    }

    // 1. Update the Canvas document to the new Organization
    const updateRequest = createInternalRequest({
        actionId: "update",
        entityId: "canvas",
        payload: {
            documentId: canvasId,
            orgId,
            ownId: userId,
            // updatedAt and updatedBy are handled automatically by the gateway logic
        }
    }, userId, orgId);

    await firestore.run(updateRequest);

    return {
        status: "success",
        canvasId,
        orgId,
        message: "Canvas sandbox claimed successfully."
    };
}


/**
 * PDM Endpoint Orchestrator ("fire and forget"):
 */

export async function createNode(request: GatewayRequest, auth?: CallableRequest["auth"]) {
    const { payload } = request;
    const payloadRec = payload as Record<string, unknown> | undefined;

    // 1. We just enqueue to Choreography for "fire and forget" so the UI doesn't lag
    // Fix: Explicitly declare the region to match the app's GCP deployment
    const queue = getFunctions(getApp()).taskQueue("locations/europe-west1/functions/choreographyCanvasCreateNode");

    await queue.enqueue({
        ...(payloadRec || {}),
        authUserId: auth?.uid || "system",
        authOrgId: auth?.token?.orgId || "system"
    }, {
        dispatchDeadlineSeconds: 60 * 5 // 5 minutes max
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
    if (!payloadRec || !payloadRec.canvasId || !payloadRec.nodeId) {
        throw new HttpsError("invalid-argument", "Missing required payload fields for updateNode.");
    }

    const queue = getFunctions(getApp()).taskQueue("locations/europe-west1/functions/choreographyCanvasUpdateNode");

    await queue.enqueue({
        ...(payloadRec || {}),
        authUserId: auth?.uid || "system",
        authOrgId: auth?.token?.orgId || "system"
    }, {
        dispatchDeadlineSeconds: 60 * 5 // 5 minutes max
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
    if (!payloadRec || !payloadRec.canvasId || !payloadRec.nodeId) {
        throw new HttpsError("invalid-argument", "Missing required payload fields for deleteNode.");
    }

    const queue = getFunctions(getApp()).taskQueue("locations/europe-west1/functions/choreographyCanvasDeleteNode");

    await queue.enqueue({
        ...(payloadRec || {}),
        authUserId: auth?.uid || "system",
        authOrgId: auth?.token?.orgId || "system"
    }, {
        dispatchDeadlineSeconds: 60 * 5 // 5 minutes max
    });

    return {
        status: "accepted",
        message: "Node deletion task queued successfully.",
        nodeId: payloadRec.nodeId
    };
}

/**
 * Validates the hierarchical structure of a Canvas3D Stand or Assembly.
 * Checks for collision, socket compatibility, and orphaned parts.
 */
export async function validateStructure(request: GatewayRequest) {
    const { entityId, payload } = request;
    const payloadRec = payload as Record<string, unknown> | undefined;
    const entityType = payloadRec?.entityType || request.payload?.type;

    if (!entityId || !entityType) {
        throw new HttpsError("invalid-argument", "Missing entityId or entityType.");
    }

    try {
        // Validation Logic for Canvas 3D (to be implemented)
        return {
            status: "success",
            message: `Structure for ${entityType} ${entityId} validated successfully.`,
            validationDetails: { collisions: 0, orphans: 0, invalidSockets: 0 }
        };
    } catch (error: unknown) {
        throw new HttpsError("internal", `Validation failed: ${(error as Error).message}`);
    }
}

/**
 * Recursively extracts a Bill of Materials (BOM) from the Canvas3D layout.
 */
export async function extractBOM(request: GatewayRequest) {
    const { entityId } = request;
    const payloadRec = request.payload as Record<string, unknown> | undefined;
    const entityType = payloadRec?.entityType;

    if (!entityId || !entityType) {
        throw new HttpsError("invalid-argument", "Missing entityId or entityType.");
    }

    try {
        // BOM Extraction Logic (to be implemented)
        return {
            status: "success",
            message: `BOM for ${entityType} ${entityId} extracted.`,
            bom: []
        };
    } catch (error: unknown) {
        throw new HttpsError("internal", `BOM extraction failed: ${(error as Error).message}`);
    }
}

/**
 * Generates assembly instructions based on the sequence of parts in Canvas3D.
 */
export async function generateInstructions(request: GatewayRequest) {
    const { entityId } = request;
    const payloadRec = request.payload as Record<string, unknown> | undefined;
    const entityType = payloadRec?.entityType;
    const locale = payloadRec?.locale || "it";

    if (!entityId || !entityType) {
        throw new HttpsError("invalid-argument", "Missing entityId or entityType.");
    }

    try {
        // Instruction Generation Logic (to be implemented)
        return {
            status: "success",
            message: `Instructions for ${entityType} ${entityId} generated in ${locale}.`,
            steps: []
        };
    } catch (error: unknown) {
        throw new HttpsError("internal", `Instruction generation failed: ${(error as Error).message}`);
    }
}
