import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createUserEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("user", uid, payload);
}

export async function updateUserEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("user", uid, docId, payload);
}

export async function deleteUserEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("user", uid, docId, payload);
}
