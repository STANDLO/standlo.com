import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createProjectEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("project", uid, payload);
}

export async function updateProjectEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("project", uid, docId, payload);
}

export async function deleteProjectEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("project", uid, docId, payload);
}
