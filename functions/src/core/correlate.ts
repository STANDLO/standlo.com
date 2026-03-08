import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Standard Dictionary for Foreign Keys to Collection Names
 * Add strictly mapped correlators here to magically apply reverse mapping
 * to any NoSQL document referencing these keys.
 */
export const FK_DICTIONARY: Record<string, string> = {
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
function extractCorrelations(data: Record<string, unknown> | null | undefined): Record<string, string> {
    const correlations: Record<string, string> = {};
    if (!data) return correlations;

    for (const [key, collection] of Object.entries(FK_DICTIONARY)) {
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
export async function applyCorrelations(
    db: admin.firestore.Firestore,
    pathSegments: string[],
    oldData: Record<string, unknown> | null | undefined,
    newData: Record<string, unknown> | null | undefined
) {
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
    const now = FieldValue.serverTimestamp();

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
                usages: FieldValue.arrayRemove(usageId),
                updatedAt: now
            }, { merge: true });
        }

        // 2. Add to new target if it exists
        if (newTargetId) {
            const reverseDocRef = db.collection(targetCol).doc(newTargetId).collection(rootCol).doc(rootId);
            batch.set(reverseDocRef, {
                usages: FieldValue.arrayUnion(usageId),
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
export async function checkSafeDeletion(db: admin.firestore.Firestore, collectionName: string, docId: string) {
    const docRef = db.collection(collectionName).doc(docId);
    const subcollections = await docRef.listCollections();

    let totalUsages = 0;
    const usageDetails: string[] = [];

    for (const subcol of subcollections) {
        const snap = await subcol.get();
        let subUsages = 0;

        snap.docs.forEach(doc => {
            const data = doc.data();
            // If it's a correlation document, it contains the array `usages`
            if (data.usages && Array.isArray(data.usages)) {
                subUsages += data.usages.length;
            } else {
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
        throw new HttpsError(
            "failed-precondition",
            `Impossibile eliminare l'entità. È attualmente vincolata e in uso da ${totalUsages} elementi correlati (${usageDetails.join(", ")}). Rimuovi prima i collegamenti.`
        );
    }
}
