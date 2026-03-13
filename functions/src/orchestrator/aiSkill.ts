import { getFirestore } from "firebase-admin/firestore";
import { getApp } from "firebase-admin/app";// Get specific DB reference
const getDb = () => getFirestore(getApp(), "standlo");

export async function createAISkillEntity(userId: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");
    
    // Auto-generate ID if missing
    let newId = payload.id as string;
    if (!newId) {
        const { randomUUID } = await import("crypto");
        newId = randomUUID();
    }

    const dataWithoutType = { ...payload };
    delete dataWithoutType.type;

    const req = createInternalRequest({
        actionId: "create",
        entityId: "ai_skill",
        payload: {
            ...dataWithoutType,
            documentId: newId,
            id: newId,
            isActive: payload.isActive !== undefined ? payload.isActive : true,
        }
    }, userId);

    const result = await firestore.run(req);
    return result.data;
}

export async function updateAISkillEntity(userId: string, id: string, payload: Record<string, unknown>) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const dataWithoutType = { ...payload };
    delete dataWithoutType.type;

    const req = createInternalRequest({
        actionId: "update",
        entityId: "ai_skill",
        payload: {
            ...dataWithoutType,
            documentId: id,
            id: id,
        }
    }, userId);

    const result = await firestore.run(req);
    return result.data;
}

export async function deleteAISkillEntity(userId: string, id: string) {
    const { firestore } = await import("../gateways/firestore");
    const { createInternalRequest } = await import("../gateways/internal");

    const req = createInternalRequest({
        actionId: "delete",
        entityId: "ai_skill",
        payload: { documentId: id }
    }, userId);

    await firestore.run(req);
    return { success: true };
}

export async function testAISkill(userId: string, payload: Record<string, unknown>) {
    const { skill, mockPayload } = payload;
    if (!skill) throw new Error("Missing skill definition for testing.");

    const { executeDynamicSkill } = await import("../genkit/dynamicFlow");
    const { randomUUID } = await import("crypto");

    const execId = randomUUID();
    const startTime = new Date().toISOString();

    try {
        const result = await executeDynamicSkill((skill as Record<string, unknown>) || {}, (mockPayload as Record<string, unknown>) || {});

        await getDb().collection("ai_skills_executions").doc(execId).set({
            skillId: (skill as Record<string, unknown>)?.id || (skill as Record<string, unknown>)?.skillId || 'unknown',
            status: "success",
            startedAt: startTime,
            completedAt: new Date().toISOString(),
            triggeredBy: userId,
            payload: mockPayload,
            result: result,
            isArchived: false,
            deletedAt: null
        });

        return { success: true, result };
    } catch (e) {
        console.error("AI Skill Test Error:", e);

        await getDb().collection("ai_skills_executions").doc(execId).set({
            skillId: (skill as Record<string, unknown>)?.id || (skill as Record<string, unknown>)?.skillId || 'unknown',
            status: "error",
            error: (e as Error).message,
            startedAt: startTime,
            completedAt: new Date().toISOString(),
            triggeredBy: userId,
            payload: mockPayload,
            isArchived: false,
            deletedAt: null
        });

        return { success: false, error: (e as Error).message || "Unknown error occurred" };
    }
}
