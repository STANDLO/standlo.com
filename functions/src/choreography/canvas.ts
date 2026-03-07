import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { buildCollectionPath } from "../gateways/entityRegistry";
import { CanvasObjectSchema } from "../schemas/canvas";

/**
 * Saves or updates a canvas entity's objects directly to Firestore using a Batched Write to the `objects` subcollection.
 * It also touches the parent document to update the `updatedAt` field.
 */
export async function saveCanvasEntity(uid: string, targetSchema: string, docId: string, orgId: string, objects: Record<string, unknown>[]) {
    try {
        const db = getFirestore(admin.app(), "standlo");
        const path = buildCollectionPath(targetSchema, orgId);

        const parentRef = db.collection(path).doc(docId);
        const objectsRef = parentRef.collection("objects");

        const batch = db.batch();

        // 1. Update the parent document's metadata to reflect a change occurred
        batch.set(parentRef, {
            updatedBy: uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // 2. Fetch existing documents to detect deletions
        const existingDocs = await objectsRef.get();
        const incomingIds = new Set(
            Array.isArray(objects)
                ? objects.map(o => (o as Record<string, unknown>).id || o.baseEntityId).filter(Boolean) as string[]
                : []
        );

        existingDocs.forEach(doc => {
            if (!incomingIds.has(doc.id)) {
                batch.delete(doc.ref);
            }
        });

        // 3. Iterate through incoming objects and set them in the subcollection
        if (Array.isArray(objects)) {
            objects.forEach((obj, index) => {
                // Ensure data meets CanvasObjectSchema. If it fails, log and skip or throw. We'll throw to be safe for PDM integrity.
                const parsedObject = CanvasObjectSchema.parse({
                    ...obj,
                    order: obj.order ?? index // Fallback order mechanism
                });

                // We assume obj has an ID to use as document ID mapping to the node uuid
                const objectDocId = (obj as Record<string, unknown>).id || parsedObject.baseEntityId;
                if (!objectDocId) throw new Error("CanvasObject missing an identifiers");

                const docRef = objectsRef.doc(objectDocId as string);
                batch.set(docRef, parsedObject);
            });
        }

        await batch.commit();

        console.log(`[Choreography][saveCanvasEntity] Successfully saved ${objects?.length} objects for ${targetSchema} ${docId}`);
        return { success: true };
    } catch (error) {
        console.error(`[Choreography][saveCanvasEntity] Error saving objects for ${targetSchema} ${docId}:`, error);
        throw error;
    }
}
