import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createRentEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("rent", uid, payload);
}

export async function updateRentEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("rent", uid, docId, payload);
}

export async function deleteRentEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("rent", uid, docId, payload);
}
