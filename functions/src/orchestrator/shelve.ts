import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createShelveEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("shelve", uid, payload);
}

export async function updateShelveEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("shelve", uid, docId, payload);
}

export async function deleteShelveEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("shelve", uid, docId, payload);
}
