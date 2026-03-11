import { onCall, HttpsError } from "firebase-functions/v2/https";
import type { CallableRequest } from "firebase-functions/v2/https";

const REGION = "europe-west4";


import { FieldValue } from "firebase-admin/firestore";
import * as crypto from "crypto";

/**
 * Interface for Canvas Actions
 */
interface CanvasRequest {
    actionId: "validateStructure" | "extractBOM" | "generateInstructions" | "createCanvasSandbox" | "claimCanvasSandbox" | "insertNode" | "deleteNode" | "updateNode";
    entityId?: string;
    entityType?: "stand" | "assembly" | "part";
    payload?: Record<string, unknown>;
    locale?: "it" | "en" | "es" | "de" | "fr" | "us";
}

/**
 * Creates a new Canvas Sandbox.
 * If the user is unauthenticated, creates a public sandbox with mock data.
 * If authenticated, creates it under their organization.
 */
async function createCanvasSandbox(request: CanvasRequest, auth?: CallableRequest["auth"]) {
    const { payload } = request;
    const { getFirestore } = await import("firebase-admin/firestore");
    const { getApp } = await import("firebase-admin/app");
    const db = getFirestore(getApp(), "standlo");
    
    // Use true crypto.randomUUID() for secure ID generation
    const canvasId = crypto.randomUUID();
    const isPublic = !auth;
    const orgId = isPublic ? "public" : (auth.token.orgId || "public");
    const userId = isPublic ? "public" : auth.uid;

    let editPasswordHash = null;
    if (payload?.editPassword && typeof payload.editPassword === "string") {
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto.scryptSync(payload.editPassword, salt, 64).toString("hex");
        editPasswordHash = `${salt}:${hash}`;
    }

    const now = FieldValue.serverTimestamp();
    const canvasDoc = {
        id: canvasId,
        name: payload?.name || (isPublic ? "Sandbox Public Canvas" : "My Canvas"),
        type: payload?.canvasType || "canvas",
        ...(editPasswordHash && { editPassword: editPasswordHash }),
        orgId,
        ownId: userId,
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId,
        deletedAt: null,
        isArchived: false,
        version: 1,
        active: true
    };

    const batch = db.batch();
    const canvasRef = db.collection("canvases").doc(canvasId);
    batch.set(canvasRef, canvasDoc);

    if (isPublic) {
        const mockObjectId = crypto.randomUUID();
        const mockRef = canvasRef.collection("objects").doc(mockObjectId);
        batch.set(mockRef, {
            id: mockObjectId,
            type: "part",
            baseEntityId: crypto.randomUUID(), 
            name: "Mock Floor",
            layerId: "pavimento",
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [5, 0.1, 5],
            order: 0,
            createdAt: now,
            createdBy: userId,
            updatedAt: now,
            updatedBy: userId,
            deletedAt: null,
            isArchived: false,
            version: 1,
            active: true
        });
    }

    await batch.commit();

    return {
        status: "success",
        canvasId,
        orgId,
        message: "Canvas sandbox created successfully.",
    };
}

/**
 * Claims a public Canvas Sandbox for a newly registered/logged in user.
 */
async function claimCanvasSandbox(request: CanvasRequest, auth?: CallableRequest["auth"]) {
    const { payload } = request;
    const { getFirestore } = await import("firebase-admin/firestore");
    const { getApp } = await import("firebase-admin/app");
    const db = getFirestore(getApp(), "standlo");

    if (!auth || !auth.uid || !auth.token.orgId) {
        throw new HttpsError("unauthenticated", "Must be authenticated to claim a canvas.");
    }
    const canvasId = payload?.canvasId as string;
    if (!canvasId) {
        throw new HttpsError("invalid-argument", "Missing canvasId.");
    }

    const orgId = auth.token.orgId;
    const userId = auth.uid;

    const canvasRef = db.collection("canvases").doc(canvasId);
    const canvasSnap = await canvasRef.get();

    if (!canvasSnap.exists) {
        throw new HttpsError("not-found", "Public canvas not found.");
    }

    const canvasData = canvasSnap.data();
    if (canvasData?.orgId !== "public") {
        return { status: "success", message: "Canvas already claimed." };
    }

    // 1. Update the Canvas document to the new Organization (subcollections remain in place globally)
    const batch = db.batch();
    batch.update(canvasRef, {
        orgId,
        ownId: userId,
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: userId
    });

    await batch.commit();

    return {
        status: "success",
        canvasId,
        orgId,
        message: "Canvas sandbox claimed successfully."
    };
}

/**
 * PDM Endpoint Orchestrator ("fire and forget"):
 * Inserts a new node into the Canvas objects subcollection.
 * Used for Optimistic UI where the client generates the ID and displays it immediately.
 */
async function insertNode(request: CanvasRequest, auth?: CallableRequest["auth"]) {
    const { payload } = request;
    if (!payload || !payload.canvasId || !payload.nodeId || !payload.baseEntityId) {
        throw new HttpsError("invalid-argument", "Missing required payload fields for insertNode.");
    }

    const { canvasId, nodeId, baseEntityId, entityType, layerId, position, rotation, scale, name, metadata } = payload;
    
    const { getFirestore } = await import("firebase-admin/firestore");
    const { getApp } = await import("firebase-admin/app");
    const db = getFirestore(getApp(), "standlo");
    const nodeRef = db.collection("canvases").doc(canvasId as string).collection("objects").doc(nodeId as string);

    const now = FieldValue.serverTimestamp();
    const userId = auth ? auth.uid : "public";

    // In a full Choreography, this could also publish a PubSub event to trigger further BOM extraction.
    // For now, we persist the client's optimistic UI state directly.
    await nodeRef.set({
        id: nodeId,
        type: entityType || request.entityType || "part",
        baseEntityId,
        name: name || "New Node",
        layerId: layerId || "strutture",
        position: position || [0, 0, 0],
        rotation: rotation || [0, 0, 0],
        scale: scale || [1, 1, 1],
        metadata: metadata || null,
        order: Date.now(),
        createdAt: now,
        createdBy: userId,
        updatedAt: now,
        updatedBy: userId,
        deletedAt: null,
        isArchived: false,
        version: 1,
        active: true
    });

    return {
        status: "success",
        message: "Node insertion registered via Orchestrator.",
        nodeId
    };
}

/**
 * PDM Endpoint Orchestrator ("fire and forget"):
 * Updates an existing node in the Canvas objects subcollection.
 * Primarily used to save the latest transform state (position, rotation, scale) when deselecting.
 */
async function updateNode(request: CanvasRequest, auth?: CallableRequest["auth"]) {
    const { payload } = request;
    if (!payload || !payload.canvasId || !payload.nodeId) {
        throw new HttpsError("invalid-argument", "Missing required payload fields for updateNode.");
    }

    const { canvasId, nodeId, position, rotation, scale, metadata } = payload;
    
    const { getFirestore } = await import("firebase-admin/firestore");
    const { getApp } = await import("firebase-admin/app");
    const db = getFirestore(getApp(), "standlo");
    const nodeRef = db.collection("canvases").doc(canvasId as string).collection("objects").doc(nodeId as string);

    const updates: Record<string, any> = {
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy: auth ? auth.uid : "public"
    };

    if (position !== undefined) updates.position = position;
    if (rotation !== undefined) updates.rotation = rotation;
    if (scale !== undefined) updates.scale = scale;
    if (metadata !== undefined) updates.metadata = metadata;

    await nodeRef.update(updates).catch((err) => {
        // If the document doesn't exist, we might want to log it but not fail completely 
        // if this was just a fire-and-forget sync. But usually we throw.
        throw new HttpsError("not-found", `Node ${nodeId} not found to update.`);
    });

    return {
        status: "success",
        message: "Node transform updated via Orchestrator."
    };
}


/**
 * Validates the hierarchical structure of a Canvas3D Stand or Assembly.
 * Checks for collision, socket compatibility, and orphaned parts.
 */
async function validateStructure(request: CanvasRequest) {
    const { entityId, entityType /*, payload */ } = request;

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
async function extractBOM(request: CanvasRequest) {
    const { entityId, entityType } = request;

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
async function generateInstructions(request: CanvasRequest) {
    const { entityId, entityType, locale = "it" } = request;

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

/**
 * Deletes a node from the Canvas objects subcollection.
 */
async function deleteNode(request: CanvasRequest, auth?: CallableRequest["auth"]) {
    const { payload } = request;
    if (!payload || !payload.canvasId || !payload.nodeId) {
        throw new HttpsError("invalid-argument", "Missing required payload fields for deleteNode.");
    }

    const { canvasId, nodeId } = payload;
    
    const { getFirestore } = await import("firebase-admin/firestore");
    const { getApp } = await import("firebase-admin/app");
    const db = getFirestore(getApp(), "standlo");
    const nodeRef = db.collection("canvases").doc(canvasId as string).collection("objects").doc(nodeId as string);

    await nodeRef.delete();

    return {
        status: "success",
        message: "Node deleted successfully.",
        nodeId
    };
}


/**
 * Canvas3D Firebase Gateway
 * Centralizes all 3D engine backend operations.
 */
export const canvas = onCall({
    region: REGION,
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR === "true" ? false : true,
    cors: process.env.FUNCTIONS_EMULATOR === "true" ? true : ["https://standlo.com", "https://www.standlo.com"],
    consumeAppCheckToken: false
}, async (request) => {
    const canvasReq = request.data as CanvasRequest;

    // 1. Verify Authentication (Bypass for Public Sandbox Operations)
    const publicActions = ["createCanvasSandbox", "insertNode", "deleteNode", "updateNode"];
    if (!request.auth && !publicActions.includes(canvasReq.actionId)) {
        throw new HttpsError("unauthenticated", "User must be authenticated for this action.");
    }

    // 2. Route Action
    switch (canvasReq.actionId) {
        case "createCanvasSandbox":
            return createCanvasSandbox(canvasReq, request.auth);
        case "claimCanvasSandbox":
            return claimCanvasSandbox(canvasReq, request.auth);
        case "insertNode":
            return insertNode(canvasReq, request.auth);
        case "deleteNode":
            return deleteNode(canvasReq, request.auth);
        case "updateNode":
            return updateNode(canvasReq, request.auth);
        case "validateStructure":
            return validateStructure(canvasReq);
        case "extractBOM":
            return extractBOM(canvasReq);
        case "generateInstructions":
            return generateInstructions(canvasReq);
        default:
            throw new HttpsError("invalid-argument", `Action '${canvasReq.actionId}' is not supported by the Canvas Gateway.`);
    }
});
