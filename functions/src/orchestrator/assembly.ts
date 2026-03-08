import { getFirestore } from "firebase-admin/firestore";

import { getApp } from "firebase-admin/app";
const firestore = getFirestore(getApp(), "standlo");
import { randomUUID } from "crypto";

export async function getAssemblyDetailsEntity(uid: string, assemblyId: string) {
    const docRef = firestore.collection("assemblies").doc(assemblyId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        throw new Error("Assembly not found");
    }

    const data = docSnap.data();
    const partsSnap = await docRef.collection("parts").get();
    const parts = partsSnap.docs.map(d => d.data());

    const processesSnap = await docRef.collection("processes").get();
    const processes = processesSnap.docs.map(d => d.data());

    return {
        status: "success",
        data: {
            ...data,
            parts,
            processes
        }
    };
}

// Helper per sincronizzare una sotto-collezione con una batch Firestore
async function syncSubcollection(
    batch: FirebaseFirestore.WriteBatch,
    parentRef: FirebaseFirestore.DocumentReference,
    collectionName: string,
    items: Record<string, unknown>[],
    uid: string,
    now: string
) {
    if (!items) return;
    const existingDocs = await parentRef.collection(collectionName).get();
    const existingIds = new Set(existingDocs.docs.map(d => d.id));

    for (const item of items) {
        const itemId = (item["id"] as string) || randomUUID();
        const docRef = parentRef.collection(collectionName).doc(itemId);

        const itemData = { ...item } as Record<string, unknown>;
        // Clean undefined properties to prevent firestore exceptions
        Object.keys(itemData).forEach(key => itemData[key] === undefined && delete itemData[key]);

        if (existingIds.has(itemId)) {
            batch.update(docRef, { ...itemData, updatedAt: now, updatedBy: uid } as Record<string, unknown>);
            existingIds.delete(itemId);
        } else {
            batch.set(docRef, { ...itemData, id: itemId, createdAt: now, createdBy: uid, updatedAt: now, updatedBy: uid });
        }
    }

    for (const idToDelete of existingIds) {
        batch.delete(parentRef.collection(collectionName).doc(idToDelete));
    }
}

export async function createAssemblyEntity(uid: string, payload: Record<string, unknown>) {
    const assemblyId = payload.id as string || randomUUID();
    const now = new Date().toISOString();

    const { parts, processes, ...corePayload } = payload;

    const assemblyData = {
        id: assemblyId,
        orgId: payload.orgId || null,
        ownId: uid,
        ...corePayload,
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid,
        deletedAt: null,
        isArchived: false
    };

    const canvasData = {
        id: assemblyId,
        orgId: payload.orgId || null,
        ownId: uid,
        name: payload.name || "Untitled Assembly",
        type: "assembly",
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid
    };

    const batch = firestore.batch();
    const parentRef = firestore.collection("assemblies").doc(assemblyId);

    batch.set(parentRef, assemblyData);
    batch.set(firestore.collection("canvas").doc(assemblyId), canvasData);

    if (Array.isArray(parts)) {
        await syncSubcollection(batch, parentRef, "parts", parts, uid, now);
    }
    if (Array.isArray(processes)) {
        await syncSubcollection(batch, parentRef, "processes", processes, uid, now);
    }

    await batch.commit();

    return {
        status: "success",
        message: "Assembly and Canvas document created successfully.",
        data: { id: assemblyId }
    };
}

export async function updateAssemblyEntity(uid: string, assemblyId: string, payload: Record<string, unknown>) {
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, parts, processes, ...restPayload } = payload;

    const updateData = {
        ...restPayload,
        updatedAt: now,
        updatedBy: uid
    };

    const canvasUpdateData: Record<string, unknown> = {
        updatedAt: now,
        updatedBy: uid
    };
    if (payload.name) canvasUpdateData.name = payload.name;

    const batch = firestore.batch();
    const parentRef = firestore.collection("assemblies").doc(assemblyId);

    // Clean undefined to avoid update issues
    Object.keys(updateData).forEach(key => (updateData as Record<string, unknown>)[key] === undefined && delete (updateData as Record<string, unknown>)[key]);

    batch.update(parentRef, updateData as Record<string, unknown>);
    batch.update(firestore.collection("canvas").doc(assemblyId), canvasUpdateData);

    if (Array.isArray(parts)) {
        await syncSubcollection(batch, parentRef, "parts", parts, uid, now);
    }
    if (Array.isArray(processes)) {
        await syncSubcollection(batch, parentRef, "processes", processes, uid, now);
    }

    await batch.commit();

    return {
        status: "success",
        message: "Assembly and Canvas document updated successfully.",
        data: { id: assemblyId }
    };
}

export async function deleteAssemblyEntity(uid: string, assemblyId: string) {
    // Note: deleting subcollections recursively should ideally be done by a background function or looping,
    // but a top level document delete handles it partially. In production, we should recursively delete or use Callable delete recursively.
    // For now we keep the same logic.
    await Promise.all([
        firestore.collection("assemblies").doc(assemblyId).delete(),
        firestore.collection("canvas").doc(assemblyId).delete()
    ]);

    return {
        status: "success",
        message: "Assembly and Canvas document deleted successfully.",
        data: { id: assemblyId }
    };
}

