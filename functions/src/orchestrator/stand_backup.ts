import { getFirestore } from "firebase-admin/firestore";

import { getApp } from "firebase-admin/app";
const firestore = getFirestore(getApp(), "standlo");
import { randomUUID } from "crypto";

export async function getStandDetailsEntity(uid: string, standId: string) {
    const docRef = firestore.collection("stands").doc(standId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        throw new Error("Stand not found");
    }

    const data = docSnap.data();
    const partsSnap = await docRef.collection("parts").get();
    const parts = partsSnap.docs.map(d => d.data());

    const processesSnap = await docRef.collection("processes").get();
    const processes = processesSnap.docs.map(d => d.data());

    const assembliesSnap = await docRef.collection("assemblies").get();
    const assemblies = assembliesSnap.docs.map(d => d.data());

    const bundlesSnap = await docRef.collection("bundles").get();
    const bundles = bundlesSnap.docs.map(d => d.data());

    return {
        status: "success",
        data: {
            ...data,
            parts,
            processes,
            assemblies,
            bundles
        }
    };
}

// Helper per sincronizzare una sotto-collezione con una batch Firestore
async function syncSubcollection(
    batch: FirebaseFirestore.WriteBatch,
    parentRef: FirebaseFirestore.DocumentReference,
    collectionName: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: Record<string, any>[],
    uid: string,
    now: string
) {
    if (!items) return;
    const existingDocs = await parentRef.collection(collectionName).get();
    const existingIds = new Set(existingDocs.docs.map(d => d.id));

    for (const item of items) {
        const itemId = item.id || randomUUID();
        const docRef = parentRef.collection(collectionName).doc(itemId);

        const itemData = { ...item };
        // Clean undefined properties to prevent firestore exceptions
        Object.keys(itemData).forEach(key => itemData[key] === undefined && delete itemData[key]);

        if (existingIds.has(itemId)) {
            batch.update(docRef, { ...itemData, updatedAt: now, updatedBy: uid });
            existingIds.delete(itemId);
        } else {
            batch.set(docRef, { ...itemData, id: itemId, createdAt: now, createdBy: uid, updatedAt: now, updatedBy: uid });
        }
    }

    for (const idToDelete of existingIds) {
        batch.delete(parentRef.collection(collectionName).doc(idToDelete));
    }
}

export async function createStandEntity(uid: string, payload: Record<string, unknown>) {
    const standId = payload.id as string || randomUUID();
    const now = new Date().toISOString();

    const { parts, processes, assemblies, bundles, ...corePayload } = payload;

    const standData = {
        id: standId,
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
        id: standId,
        orgId: payload.orgId || null,
        ownId: uid,
        name: payload.name || "Untitled Stand",
        type: "stand",
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid
    };

    const batch = firestore.batch();
    const parentRef = firestore.collection("stands").doc(standId);

    batch.set(parentRef, standData);
    batch.set(firestore.collection("canvas").doc(standId), canvasData);

    if (Array.isArray(parts)) {
        await syncSubcollection(batch, parentRef, "parts", parts, uid, now);
    }
    if (Array.isArray(processes)) {
        await syncSubcollection(batch, parentRef, "processes", processes, uid, now);
    }
    if (Array.isArray(assemblies)) {
        await syncSubcollection(batch, parentRef, "assemblies", assemblies, uid, now);
    }
    if (Array.isArray(bundles)) {
        await syncSubcollection(batch, parentRef, "bundles", bundles, uid, now);
    }

    await batch.commit();

    return {
        status: "success",
        message: "Stand and Canvas document created successfully.",
        data: { id: standId }
    };
}

export async function updateStandEntity(uid: string, standId: string, payload: Record<string, unknown>) {
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, parts, processes, assemblies, bundles, ...restPayload } = payload;

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
    const parentRef = firestore.collection("stands").doc(standId);

    // Clean undefined to avoid update issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.keys(updateData).forEach(key => (updateData as Record<string, any>)[key] === undefined && delete (updateData as Record<string, any>)[key]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batch.update(parentRef, updateData as Record<string, any>);
    batch.update(firestore.collection("canvas").doc(standId), canvasUpdateData);

    if (Array.isArray(parts)) {
        await syncSubcollection(batch, parentRef, "parts", parts, uid, now);
    }
    if (Array.isArray(processes)) {
        await syncSubcollection(batch, parentRef, "processes", processes, uid, now);
    }
    if (Array.isArray(assemblies)) {
        await syncSubcollection(batch, parentRef, "assemblies", assemblies, uid, now);
    }
    if (Array.isArray(bundles)) {
        await syncSubcollection(batch, parentRef, "bundles", bundles, uid, now);
    }

    await batch.commit();

    return {
        status: "success",
        message: "Stand and Canvas document updated successfully.",
        data: { id: standId }
    };
}

export async function deleteStandEntity(uid: string, standId: string) {
    // Note: deleting subcollections recursively should ideally be done by a background function or looping
    await Promise.all([
        firestore.collection("stands").doc(standId).delete(),
        firestore.collection("canvas").doc(standId).delete()
    ]);

    return {
        status: "success",
        message: "Stand and Canvas document deleted successfully.",
        data: { id: standId }
    };
}
