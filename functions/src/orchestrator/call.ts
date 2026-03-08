import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createCallEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("call", uid, payload);
}

export async function updateCallEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("call", uid, docId, payload);
}

export async function deleteCallEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("call", uid, docId, payload);
}
