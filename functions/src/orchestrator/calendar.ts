import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createCalendarEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("calendar", uid, payload);
}

export async function updateCalendarEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("calendar", uid, docId, payload);
}

export async function deleteCalendarEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("calendar", uid, docId, payload);
}
