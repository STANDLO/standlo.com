import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { applyCorrelations } from "../core/correlate";

/**
 * Triggers on all root collection documents.
 * Extracts any ID references ending in 'Id' (defined in FK_DICTIONARY) and populates reverse subcollections.
 */
export const correlateRoot = onDocumentWritten({
    document: "{colId}/{docId}",
    database: "standlo",
    namespace: "{namespaceId}",
    region: "europe-west4"
}, async (event) => {
    // Only process if admin is initialized (it is in index.ts)
    if (admin.apps.length === 0) return;

    const db = getFirestore(admin.app(), "standlo");
    const oldData = event.data?.before.exists ? event.data.before.data() : null;
    const newData = event.data?.after.exists ? event.data.after.data() : null;

    await applyCorrelations(db, [event.params.colId, event.params.docId], oldData, newData);
});

/**
 * Triggers on all direct subcollection documents.
 * Extracts ID references and populates reverse subcollections linking the root entity to the target entity.
 */
export const correlateSub = onDocumentWritten({
    document: "{colId}/{docId}/{subColId}/{subDocId}",
    database: "standlo",
    namespace: "{namespaceId}",
    region: "europe-west4"
}, async (event) => {
    if (admin.apps.length === 0) return;

    const db = getFirestore(admin.app(), "standlo");
    const oldData = event.data?.before.exists ? event.data.before.data() : null;
    const newData = event.data?.after.exists ? event.data.after.data() : null;

    await applyCorrelations(db, [
        event.params.colId,
        event.params.docId,
        event.params.subColId,
        event.params.subDocId
    ], oldData, newData);
});
