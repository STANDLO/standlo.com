import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createTaskEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("task", uid, payload);
}

export async function updateTaskEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("task", uid, docId, payload);
}

export async function deleteTaskEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("task", uid, docId, payload);
}
