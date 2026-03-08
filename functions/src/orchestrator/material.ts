import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createMaterialEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("material", uid, payload);
}

export async function updateMaterialEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("material", uid, docId, payload);
}

export async function deleteMaterialEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("material", uid, docId, payload);
}
