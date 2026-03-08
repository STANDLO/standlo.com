import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createPaymentEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("payment", uid, payload);
}

export async function updatePaymentEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("payment", uid, docId, payload);
}

export async function deletePaymentEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("payment", uid, docId, payload);
}
