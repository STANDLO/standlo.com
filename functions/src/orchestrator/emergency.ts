import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createEmergencyEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("emergency", uid, payload);
}

export async function updateEmergencyEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("emergency", uid, docId, payload);
}

export async function deleteEmergencyEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("emergency", uid, docId, payload);
}
