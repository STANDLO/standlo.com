import { getFirestore } from "firebase-admin/firestore";

import { getApp } from "firebase-admin/app";
const firestore = getFirestore(getApp(), "standlo");
import { randomUUID } from "crypto";

export async function getBundleDetailsEntity(uid: string, bundleId: string) {
    const docRef = firestore.collection("bundles").doc(bundleId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
        throw new Error("Bundle not found");
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

export async function createBundleEntity(uid: string, payload: Record<string, unknown>) {
    const bundleId = payload.id as string || randomUUID();
    const now = new Date().toISOString();

    const { parts, processes, ...corePayload } = payload;

    const bundleData = {
        id: bundleId,
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
        id: bundleId,
        orgId: payload.orgId || null,
        ownId: uid,
        name: payload.name || "Untitled Bundle",
        type: "bundle",
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid
    };

    const batch = firestore.batch();
    const parentRef = firestore.collection("bundles").doc(bundleId);

    batch.set(parentRef, bundleData);
    batch.set(firestore.collection("canvas").doc(bundleId), canvasData);

    if (Array.isArray(parts)) {
        await syncSubcollection(batch, parentRef, "parts", parts, uid, now);
    }
    if (Array.isArray(processes)) {
        await syncSubcollection(batch, parentRef, "processes", processes, uid, now);
    }

    await batch.commit();

    return {
        status: "success",
        message: "Bundle and Canvas document created successfully.",
        data: { id: bundleId }
    };
}

export async function updateBundleEntity(uid: string, bundleId: string, payload: Record<string, unknown>) {
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
    const parentRef = firestore.collection("bundles").doc(bundleId);

    // Clean undefined to avoid update issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Object.keys(updateData).forEach(key => (updateData as Record<string, any>)[key] === undefined && delete (updateData as Record<string, any>)[key]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    batch.update(parentRef, updateData as Record<string, any>);
    batch.update(firestore.collection("canvas").doc(bundleId), canvasUpdateData);

    if (Array.isArray(parts)) {
        await syncSubcollection(batch, parentRef, "parts", parts, uid, now);
    }
    if (Array.isArray(processes)) {
        await syncSubcollection(batch, parentRef, "processes", processes, uid, now);
    }

    await batch.commit();

    return {
        status: "success",
        message: "Bundle and Canvas document updated successfully.",
        data: { id: bundleId }
    };
}

export async function deleteBundleEntity(uid: string, bundleId: string) {
    // Note: deleting subcollections recursively should ideally be done by a background function or looping
    await Promise.all([
        firestore.collection("bundles").doc(bundleId).delete(),
        firestore.collection("canvas").doc(bundleId).delete()
    ]);

    return {
        status: "success",
        message: "Bundle and Canvas document deleted successfully.",
        data: { id: bundleId }
    };
}
