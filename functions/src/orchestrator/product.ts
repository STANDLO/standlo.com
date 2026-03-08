import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createProductEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("product", uid, payload);
}

export async function updateProductEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("product", uid, docId, payload);
}

export async function deleteProductEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("product", uid, docId, payload);
}
