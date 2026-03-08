import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createTextureEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("texture", uid, payload);
}

export async function updateTextureEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("texture", uid, docId, payload);
}

export async function deleteTextureEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("texture", uid, docId, payload);
}
