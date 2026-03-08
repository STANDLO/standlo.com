import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createMessageEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("message", uid, payload);
}

export async function updateMessageEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("message", uid, docId, payload);
}

export async function deleteMessageEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("message", uid, docId, payload);
}
