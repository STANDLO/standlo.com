import { getFirestore } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { randomUUID } from "crypto";
import { buildCollectionPath } from "../gateways/entityRegistry";

export async function createGenericEntity(entityId: string, uid: string, payload: Record<string, unknown>) {
    const db = getFirestore(admin.app(), "standlo");
    const newId = (payload.id as string) || randomUUID();
    const now = new Date().toISOString();

    const collectionPath = buildCollectionPath(entityId, payload.orgId as string);

    const docData = {
        id: newId,
        ownId: uid,
        ...payload,
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid,
        deletedAt: null,
        isArchived: false
    };

    await db.collection(collectionPath).doc(newId).set(docData);

    return {
        status: "success",
        data: {
            id: newId,
            path: `${collectionPath}/${newId}`
        }
    };
}

export async function updateGenericEntity(entityId: string, uid: string, docId: string, payload: Record<string, unknown>) {
    const db = getFirestore(admin.app(), "standlo");
    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...restPayload } = payload;

    const collectionPath = buildCollectionPath(entityId, payload.orgId as string);

    const updateData = {
        ...restPayload,
        updatedAt: now,
        updatedBy: uid
    };

    await db.collection(collectionPath).doc(docId).update(updateData);

    return {
        status: "success",
        data: {
            id: docId,
            path: `${collectionPath}/${docId}`
        }
    };
}

export async function deleteGenericEntity(entityId: string, uid: string, docId: string, payload: Record<string, unknown>) {
    const db = getFirestore(admin.app(), "standlo");
    const now = new Date().toISOString();

    const collectionPath = buildCollectionPath(entityId, payload.orgId as string);

    await db.collection(collectionPath).doc(docId).update({
        deletedAt: now,
        updatedBy: uid,
        isArchived: true
    });

    return {
        status: "success",
        data: {
            id: docId,
            path: `${collectionPath}/${docId}`
        }
    };
}
