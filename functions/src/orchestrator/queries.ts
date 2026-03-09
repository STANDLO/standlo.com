import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";
import { buildCollectionPath } from "../gateways/entityRegistry";
import { getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore(getApp(), "standlo");

export async function listEntities(uid: string, entityId: string, orgId?: string, payload?: Record<string, unknown>) {
    if (!entityId) {
        throw new HttpsError("invalid-argument", "Entity ID is required for listing entities.");
    }

    // Allow basic entity list for PDM
    const path = buildCollectionPath(entityId, orgId); // Org ID can be empty for global PDM entities
    let query: admin.firestore.Query = db.collection(path);

    const filters = payload?.filters as Array<{ field: string, op: string, value: unknown }>;
    if (filters && Array.isArray(filters)) {
        filters.forEach(f => {
            query = query.where(f.field, f.op as admin.firestore.WhereFilterOp, f.value);
        });
    }

    const ignoreSystemFilters = payload?.ignoreSystemFilters === true;

    if (!ignoreSystemFilters) {
        const hasDeletedFilter = filters?.find(f => f.field === 'deletedAt');
        if (!hasDeletedFilter) {
            query = query.where('deletedAt', '==', null);
        }
        const hasArchivedFilter = filters?.find(f => f.field === 'isArchived');
        if (!hasArchivedFilter) {
            query = query.where('isArchived', '==', false);
        }
    }

    const orderBy = payload?.orderBy as Array<{ field: string, direction: 'asc' | 'desc' }>;
    if (orderBy && Array.isArray(orderBy)) {
        orderBy.forEach(o => {
            query = query.orderBy(o.field, o.direction);
        });
    } else {
        query = query.orderBy('createdAt', 'desc');
    }

    query = query.limit((payload?.limit as number) || 50);

    const cursor = payload?.cursor as string;
    if (cursor) {
        const cursorDoc = await db.collection(path).doc(cursor).get();
        if (cursorDoc.exists) {
            query = query.startAfter(cursorDoc);
        }
    }

    const snapshot = await query.get();
    const resultData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
        status: "success",
        data: resultData
    };
}

export async function readEntity(uid: string, entityId: string, docId: string) {
    if (!entityId || !docId) {
        throw new HttpsError("invalid-argument", "Entity ID and Document ID are required for reading an entity.");
    }
    const path = buildCollectionPath(entityId, "");
    const docSnap = await db.collection(path).doc(docId).get();

    if (!docSnap.exists) {
        throw new HttpsError("not-found", "Document not found.");
    }

    return {
        status: "success",
        data: { id: docSnap.id, ...docSnap.data() }
    };
}
