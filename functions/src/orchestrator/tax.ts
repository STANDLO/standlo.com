import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createTaxEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("tax", uid, payload);
}

export async function updateTaxEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("tax", uid, docId, payload);
}

export async function deleteTaxEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("tax", uid, docId, payload);
}
