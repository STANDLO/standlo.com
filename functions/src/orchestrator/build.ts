import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createBuildEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("build", uid, payload);
}

export async function updateBuildEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("build", uid, docId, payload);
}

export async function deleteBuildEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("build", uid, docId, payload);
}
