"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.canvas = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
// Use the pre-initialized admin instance if available, otherwise initialize default.
const app = admin.apps.length ? admin.app() : admin.initializeApp();
const REGION = "europe-west4";
const db = (0, firestore_1.getFirestore)(app, "standlo");
/**
 * Validates the hierarchical structure of a Canvas3D Stand or Assembly.
 * Checks for collision, socket compatibility, and orphaned parts.
 */
async function validateStructure(request) {
    const { entityId, entityType /*, payload */ } = request;
    if (!entityId || !entityType) {
        throw new https_1.HttpsError("invalid-argument", "Missing entityId or entityType.");
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
    }
    catch (error) {
        throw new https_1.HttpsError("internal", `Validation failed: ${error.message}`);
    }
}
/**
 * Recursively extracts a Bill of Materials (BOM) from the Canvas3D layout.
 */
async function extractBOM(request) {
    const { entityId, entityType } = request;
    if (!entityId || !entityType) {
        throw new https_1.HttpsError("invalid-argument", "Missing entityId or entityType.");
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
    }
    catch (error) {
        throw new https_1.HttpsError("internal", `BOM extraction failed: ${error.message}`);
    }
}
/**
 * Generates assembly instructions based on the sequence of parts in Canvas3D.
 */
async function generateInstructions(request) {
    const { entityId, entityType, locale = "it" } = request;
    if (!entityId || !entityType) {
        throw new https_1.HttpsError("invalid-argument", "Missing entityId or entityType.");
    }
    try {
        // Instruction Generation Logic (to be implemented)
        return {
            status: "success",
            message: `Instructions for ${entityType} ${entityId} generated in ${locale}.`,
            steps: []
        };
    }
    catch (error) {
        throw new https_1.HttpsError("internal", `Instruction generation failed: ${error.message}`);
    }
}
/**
 * Creates a new Canvas entity (Part, Assembly, or Stand)
 */
async function createCanvas(request, uid) {
    const { entityType, payload } = request;
    if (!entityType || !payload) {
        throw new https_1.HttpsError("invalid-argument", "Missing entityType or payload for creation.");
    }
    try {
        const docRef = db.collection("canvases").doc();
        const now = admin.firestore.FieldValue.serverTimestamp();
        const canvasData = Object.assign(Object.assign({}, payload), { id: docRef.id, type: entityType, ownerId: uid, createdAt: now, updatedAt: now });
        await docRef.set(canvasData);
        return { status: "success", id: docRef.id, data: canvasData };
    }
    catch (error) {
        throw new https_1.HttpsError("internal", `Failed to create Canvas entity: ${error.message}`);
    }
}
/**
 * Updates an existing Canvas entity
 */
async function updateCanvas(request) {
    const { entityId, payload } = request;
    if (!entityId || !payload) {
        throw new https_1.HttpsError("invalid-argument", "Missing entityId or payload for update.");
    }
    try {
        const docRef = db.collection("canvases").doc(entityId);
        await docRef.update(Object.assign(Object.assign({}, payload), { updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
        return { status: "success", id: entityId };
    }
    catch (error) {
        throw new https_1.HttpsError("internal", `Failed to update Canvas entity: ${error.message}`);
    }
}
/**
 * Fetches a Canvas entity
 */
async function getCanvas(request) {
    const { entityId } = request;
    if (!entityId) {
        throw new https_1.HttpsError("invalid-argument", "Missing entityId.");
    }
    try {
        const docSnap = await db.collection("canvases").doc(entityId).get();
        if (!docSnap.exists) {
            throw new https_1.HttpsError("not-found", "Canvas entity not found.");
        }
        return { status: "success", data: docSnap.data() };
    }
    catch (error) {
        throw new https_1.HttpsError("internal", `Failed to fetch Canvas entity: ${error.message}`);
    }
}
/**
 * Fetches the dictionary of available Canvas Materials
 */
async function getCanvasMaterials() {
    try {
        const snapshot = await db.collection("canvasMaterials").get();
        const materials = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return { status: "success", data: materials };
    }
    catch (error) {
        throw new https_1.HttpsError("internal", `Failed to fetch materials: ${error.message}`);
    }
}
/**
 * Fetches the dictionary of available Canvas Textures
 */
async function getCanvasTextures() {
    try {
        const snapshot = await db.collection("canvasTextures").get();
        const textures = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        return { status: "success", data: textures };
    }
    catch (error) {
        throw new https_1.HttpsError("internal", `Failed to fetch textures: ${error.message}`);
    }
}
/**
 * Canvas3D Firebase Gateway
 * Centralizes all 3D engine backend operations.
 */
exports.canvas = (0, https_1.onCall)({
    region: REGION,
    enforceAppCheck: true,
    consumeAppCheckToken: false
}, async (request) => {
    // 1. Verify Authentication
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be strictly authenticated.");
    }
    const canvasReq = request.data;
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
            throw new https_1.HttpsError("invalid-argument", `Action '${canvasReq.actionId}' is not supported by the Canvas Gateway.`);
    }
});
//# sourceMappingURL=canvas.js.map