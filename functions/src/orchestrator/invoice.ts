import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createInvoiceEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("invoice", uid, payload);
}

export async function updateInvoiceEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("invoice", uid, docId, payload);
}

export async function deleteInvoiceEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("invoice", uid, docId, payload);
}
