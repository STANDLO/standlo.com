import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createWorkcenterEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("workcenter", uid, payload);
}

export async function updateWorkcenterEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("workcenter", uid, docId, payload);
}

export async function deleteWorkcenterEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("workcenter", uid, docId, payload);
}
