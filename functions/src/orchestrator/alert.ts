import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createAlertEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("alert", uid, payload);
}

export async function updateAlertEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("alert", uid, docId, payload);
}

export async function deleteAlertEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("alert", uid, docId, payload);
}
