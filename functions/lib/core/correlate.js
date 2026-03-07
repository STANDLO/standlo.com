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
exports.FK_DICTIONARY = void 0;
exports.applyCorrelations = applyCorrelations;
exports.checkSafeDeletion = checkSafeDeletion;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
/**
 * Standard Dictionary for Foreign Keys to Collection Names
 * Add strictly mapped correlators here to magically apply reverse mapping
 * to any NoSQL document referencing these keys.
 */
exports.FK_DICTIONARY = {
    meshId: "meshes",
    partId: "parts",
    assemblyId: "assemblies",
    bundleId: "bundles",
    processId: "processes",
    standId: "stands",
    fairId: "fairs",
    projectId: "projects",
    orgId: "organizations",
    materialId: "materials"
};
/**
 * Parses the document data and extracts target dependencies based on FK_DICTIONARY.
 */
function extractCorrelations(data) {
    const correlations = {};
    if (!data)
        return correlations;
    for (const [key, collection] of Object.entries(exports.FK_DICTIONARY)) {
        if (data[key] && typeof data[key] === "string") {
            correlations[collection] = data[key]; // e.g., { "meshes": "mesh-id-123" }
        }
    }
    return correlations;
}
/**
 * Core utility that generates fire-and-forget batch correlation writes.
 * It uses arrayUnion / arrayRemove to correctly handle multiple sub-items pointing to the same target.
 */
async function applyCorrelations(db, pathSegments, oldData, newData) {
    if (pathSegments.length !== 2 && pathSegments.length !== 4) {
        // We only correlate root entities (2) or direct subcollections (4)
        return;
    }
    const rootCol = pathSegments[0];
    const rootId = pathSegments[1];
    // If it's a subcollection document (e.g. assemblies/{id}/parts/{subId}), we track the exact subId
    // If it's a root document (e.g. parts/{id}), we use the rootId itself.
    const usageId = pathSegments.length === 4 ? pathSegments[3] : rootId;
    const oldCorrelations = extractCorrelations(oldData);
    const newCorrelations = extractCorrelations(newData);
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();
    const collectionsToProcess = new Set([
        ...Object.keys(oldCorrelations),
        ...Object.keys(newCorrelations)
    ]);
    for (const targetCol of collectionsToProcess) {
        const oldTargetId = oldCorrelations[targetCol];
        const newTargetId = newCorrelations[targetCol];
        if (oldTargetId === newTargetId) {
            // No change for this specific relation
            continue;
        }
        // 1. Remove from old target if it existed and is different
        if (oldTargetId) {
            const reverseDocRef = db.collection(targetCol).doc(oldTargetId).collection(rootCol).doc(rootId);
            batch.set(reverseDocRef, {
                usages: admin.firestore.FieldValue.arrayRemove(usageId),
                updatedAt: now
            }, { merge: true });
        }
        // 2. Add to new target if it exists
        if (newTargetId) {
            const reverseDocRef = db.collection(targetCol).doc(newTargetId).collection(rootCol).doc(rootId);
            batch.set(reverseDocRef, {
                usages: admin.firestore.FieldValue.arrayUnion(usageId),
                updatedAt: now,
                correlatedAt: now // Track when the correlation was first made
            }, { merge: true });
        }
    }
    // Fire and forget, but wait for the batch to ensure it is flushed in a Cloud Function
    // Cloud Functions might terminate if we don't await.
    await batch.commit();
}
/**
 * Validates if the given document is currently safe to be deleted.
 * Checks all subcollections for usages (reverse-mappings from correlation)
 * or existing compositional items. If any exist, it throws an HttpsError preventing deletion.
 */
async function checkSafeDeletion(db, collectionName, docId) {
    const docRef = db.collection(collectionName).doc(docId);
    const subcollections = await docRef.listCollections();
    let totalUsages = 0;
    const usageDetails = [];
    for (const subcol of subcollections) {
        const snap = await subcol.get();
        let subUsages = 0;
        snap.docs.forEach(doc => {
            const data = doc.data();
            // If it's a correlation document, it contains the array `usages`
            if (data.usages && Array.isArray(data.usages)) {
                subUsages += data.usages.length;
            }
            else {
                // Otherwise it's a standard sub-document (e.g., composition), count as 1 usage
                subUsages += 1;
            }
        });
        if (subUsages > 0) {
            totalUsages += subUsages;
            usageDetails.push(`${subUsages} in ${subcol.id}`);
        }
    }
    if (totalUsages > 0) {
        throw new https_1.HttpsError("failed-precondition", `Impossibile eliminare l'entità. È attualmente vincolata e in uso da ${totalUsages} elementi correlati (${usageDetails.join(", ")}). Rimuovi prima i collegamenti.`);
    }
}
//# sourceMappingURL=correlate.js.map