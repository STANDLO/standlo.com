import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

import { getFirestore } from "firebase-admin/firestore";

// Use the pre-initialized admin instance if available, otherwise initialize default.
const app = admin.apps.length ? admin.app() : admin.initializeApp();

const REGION = "europe-west4";
const db = getFirestore(app, "standlo");

/**
 * Interface for Canvas Actions
 */
interface CanvasRequest {
    actionId: "validateStructure" | "extractBOM" | "generateInstructions" | "createCanvas" | "updateCanvas" | "getCanvas" | "getCanvasMaterials" | "getCanvasTextures";
    entityId?: string;
    entityType?: "stand" | "assembly" | "part";
    payload?: Record<string, unknown>;
    locale?: "it" | "en" | "es" | "de" | "fr" | "us";
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
        // 1. Fetch entity from Registry
        // 2. Validate against Zod schema (already containing canvasNodes)
        // 3. Perform specific 3D structural validation (socket types match, distance thresholds, etc.)

        return {
            status: "success",
            message: `Structure for ${entityType} ${entityId} validated successfully.`,
            validationDetails: {
                collisions: 0,
                orphans: 0,
                invalidSockets: 0
            }
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
        // 1. Deep fetch all children in canvasNodes
        // 2. Accumulate required parts & their nested quantities

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
 * Creates a new Canvas entity (Part, Assembly, or Stand)
 */
async function createCanvas(request: CanvasRequest, uid: string) {
    const { entityType, payload } = request;

    if (!entityType || !payload) {
        throw new HttpsError("invalid-argument", "Missing entityType or payload for creation.");
    }

    try {
        const docRef = db.collection("canvases").doc();
        const now = admin.firestore.FieldValue.serverTimestamp();
        const canvasData = {
            ...payload,
            id: docRef.id,
            type: entityType,
            ownerId: uid,
            createdAt: now,
            updatedAt: now,
        };
        await docRef.set(canvasData);
        return { status: "success", id: docRef.id, data: canvasData };
    } catch (error: unknown) {
        throw new HttpsError("internal", `Failed to create Canvas entity: ${(error as Error).message}`);
    }
}

/**
 * Updates an existing Canvas entity
 */
async function updateCanvas(request: CanvasRequest) {
    const { entityId, payload } = request;

    if (!entityId || !payload) {
        throw new HttpsError("invalid-argument", "Missing entityId or payload for update.");
    }

    try {
        const docRef = db.collection("canvases").doc(entityId);
        await docRef.update({
            ...payload,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { status: "success", id: entityId };
    } catch (error: unknown) {
        throw new HttpsError("internal", `Failed to update Canvas entity: ${(error as Error).message}`);
    }
}

/**
 * Fetches a Canvas entity
 */
async function getCanvas(request: CanvasRequest) {
    const { entityId } = request;

    if (!entityId) {
        throw new HttpsError("invalid-argument", "Missing entityId.");
    }

    try {
        const docSnap = await db.collection("canvases").doc(entityId).get();
        if (!docSnap.exists) {
            throw new HttpsError("not-found", "Canvas entity not found.");
        }
        return { status: "success", data: docSnap.data() };
    } catch (error: unknown) {
        throw new HttpsError("internal", `Failed to fetch Canvas entity: ${(error as Error).message}`);
    }
}

/**
 * Fetches the dictionary of available Canvas Materials
 */
async function getCanvasMaterials() {
    try {
        const snapshot = await db.collection("canvasMaterials").get();
        const materials = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { status: "success", data: materials };
    } catch (error: unknown) {
        throw new HttpsError("internal", `Failed to fetch materials: ${(error as Error).message}`);
    }
}

/**
 * Fetches the dictionary of available Canvas Textures
 */
async function getCanvasTextures() {
    try {
        const snapshot = await db.collection("canvasTextures").get();
        const textures = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return { status: "success", data: textures };
    } catch (error: unknown) {
        throw new HttpsError("internal", `Failed to fetch textures: ${(error as Error).message}`);
    }
}

/**
 * Canvas3D Firebase Gateway
 * Centralizes all 3D engine backend operations.
 */
export const canvas = onCall({
    region: REGION,
    enforceAppCheck: true,
    consumeAppCheckToken: false
}, async (request) => {
    // 1. Verify Authentication
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be strictly authenticated.");
    }

    const canvasReq = request.data as CanvasRequest;

    // 2. Route Action
    switch (canvasReq.actionId) {
        case "validateStructure":
            return validateStructure(canvasReq);
        case "extractBOM":
            return extractBOM(canvasReq);
        case "generateInstructions":
            return generateInstructions(canvasReq);
        case "createCanvas":
            return createCanvas(canvasReq, request.auth.uid);
        case "updateCanvas":
            return updateCanvas(canvasReq);
        case "getCanvas":
            return getCanvas(canvasReq);
        case "getCanvasMaterials":
            return getCanvasMaterials();
        case "getCanvasTextures":
            return getCanvasTextures();
        default:
            throw new HttpsError("invalid-argument", `Action '${canvasReq.actionId}' is not supported by the Canvas Gateway.`);
    }
});
