import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createApikeyEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("apikey", uid, payload);
}

export async function updateApikeyEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("apikey", uid, docId, payload);
}

export async function deleteApikeyEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("apikey", uid, docId, payload);
}
