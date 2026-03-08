import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createExhibitorEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("exhibitor", uid, payload);
}

export async function updateExhibitorEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("exhibitor", uid, docId, payload);
}

export async function deleteExhibitorEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("exhibitor", uid, docId, payload);
}
