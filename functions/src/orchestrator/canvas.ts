import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createCanvasEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("canvas", uid, payload);
}

export async function updateCanvasEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("canvas", uid, docId, payload);
}

export async function deleteCanvasEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("canvas", uid, docId, payload);
}
