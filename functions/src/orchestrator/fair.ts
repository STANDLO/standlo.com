import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createFairEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("fair", uid, payload);
}

export async function updateFairEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("fair", uid, docId, payload);
}

export async function deleteFairEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("fair", uid, docId, payload);
}
