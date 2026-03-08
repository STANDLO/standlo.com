import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createExhibitionEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("exhibition", uid, payload);
}

export async function updateExhibitionEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("exhibition", uid, docId, payload);
}

export async function deleteExhibitionEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("exhibition", uid, docId, payload);
}
