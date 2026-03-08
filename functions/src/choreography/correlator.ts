import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { applyCorrelations } from "../core/correlate";
import { DocumentOptions } from "firebase-functions/v2/firestore";

const rootOptions: DocumentOptions = { document: "{colId}/{docId}", database: "standlo", namespace: "{namespaceId}", region: "europe-west4" };

/**
 * Triggers on all root collection documents.
 * Extracts any ID references ending in 'Id' (defined in FK_DICTIONARY) and populates reverse subcollections.
 */
export const correlateRoot = onDocumentWritten(rootOptions, async (event) => {
    // Only process if admin is initialized (it is in index.ts)
    if (admin.apps.length === 0) return;

    const db = getFirestore(admin.app(), "standlo");
    const oldData = event.data?.before.exists ? event.data.before.data() : null;
    const newData = event.data?.after.exists ? event.data.after.data() : null;

    await applyCorrelations(db, [event.params.colId, event.params.docId], oldData, newData);
});

const subOptions: DocumentOptions = { document: "{colId}/{docId}/{subColId}/{subDocId}", database: "standlo", namespace: "{namespaceId}", region: "europe-west4" };

/**
 * Triggers on all direct subcollection documents.
 * Extracts ID references and populates reverse subcollections linking the root entity to the target entity.
 */
export const correlateSub = onDocumentWritten(subOptions, async (event) => {
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

const isEmulatorTarget = process.env.FUNCTIONS_EMULATOR === "true" || !!process.env.FIRESTORE_EMULATOR_HOST || process.env.GCLOUD_PROJECT === "demo-standlo";

// Bypass for Eventarc impossible triad bug
if (isEmulatorTarget && (correlateRoot as unknown as Record<string, unknown>).__endpoint) {
    const endpoint = (correlateRoot as unknown as Record<string, unknown>).__endpoint as Record<string, unknown>;
    const eventTrigger = endpoint.eventTrigger as Record<string, unknown>;
    const eventFilters = (eventTrigger.eventFilters || {}) as Record<string, unknown>;

    endpoint.eventTrigger = {
        ...eventTrigger,
        eventFilters: {
            ...eventFilters,
            namespace: "(default)"
        }
    };
}
if (isEmulatorTarget && (correlateSub as unknown as Record<string, unknown>).__endpoint) {
    const endpoint = (correlateSub as unknown as Record<string, unknown>).__endpoint as Record<string, unknown>;
    const eventTrigger = endpoint.eventTrigger as Record<string, unknown>;
    const eventFilters = (eventTrigger.eventFilters || {}) as Record<string, unknown>;

    endpoint.eventTrigger = {
        ...eventTrigger,
        eventFilters: {
            ...eventFilters,
            namespace: "(default)"
        }
    };
}

