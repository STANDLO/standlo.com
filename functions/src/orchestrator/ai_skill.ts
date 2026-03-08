import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createAi_skillEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("ai_skill", uid, payload);
}

export async function updateAi_skillEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("ai_skill", uid, docId, payload);
}

export async function deleteAi_skillEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("ai_skill", uid, docId, payload);
}
