import { createGenericEntity, updateGenericEntity, deleteGenericEntity } from "./generic";

export async function createPipeline_executionEntity(uid: string, payload: Record<string, unknown>) {
    return createGenericEntity("pipeline_execution", uid, payload);
}

export async function updatePipeline_executionEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return updateGenericEntity("pipeline_execution", uid, docId, payload);
}

export async function deletePipeline_executionEntity(uid: string, docId: string, payload: Record<string, unknown>) {
    return deleteGenericEntity("pipeline_execution", uid, docId, payload);
}
