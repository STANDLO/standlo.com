import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createNotificationEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("notification", uid, payload);
}

export async function updateNotificationEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("notification", uid, docId, payload);
}

export async function deleteNotificationEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("notification", uid, docId, payload);
}
