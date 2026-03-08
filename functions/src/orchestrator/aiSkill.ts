import { getFirestore } from "firebase-admin/firestore";
import { getApp } from "firebase-admin/app";
import { AISkillSchema } from "../schemas/aiSkill";

// Get specific DB reference
const getDb = () => getFirestore(getApp(), "standlo");

export async function createAISkillEntity(userId: string, payload: Record<string, unknown>) {
    const db = getDb();

    // Auto-generate ID if missing
    if (!payload.id) {
        payload.id = db.collection('ai_skills').doc().id;
    }

    const dataWithoutType = { ...payload };
    delete dataWithoutType.type;

    // Add base fields
    const enrichedData = {
        ...dataWithoutType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId,
        isActive: payload.isActive !== undefined ? payload.isActive : true,
        isArchived: false,
    };

    const parsed = AISkillSchema.parse(enrichedData);

    await db.collection("ai_skills").doc(parsed.id as string).set(parsed, { merge: true });
    return parsed;
}

export async function updateAISkillEntity(userId: string, id: string, payload: Record<string, unknown>) {
    const db = getDb();

    const dataWithoutType = { ...payload };
    delete dataWithoutType.type;

    const enrichment = {
        ...dataWithoutType,
        id,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
    };

    // We fetch current entity to merge it safely before zod parse
    const snap = await db.collection("ai_skills").doc(id).get();
    if (!snap.exists) throw new Error("Entity not found");

    const mergedData = {
        ...snap.data(),
        ...enrichment
    };

    const parsed = AISkillSchema.parse(mergedData);

    await db.collection("ai_skills").doc(id).set(parsed, { merge: true });
    return parsed;
}

export async function deleteAISkillEntity(userId: string, id: string) {
    const db = getDb();

    // Soft delete
    await db.collection("ai_skills").doc(id).update({
        isArchived: true,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
    });

    return { success: true };
}

export async function testAISkill(userId: string, payload: Record<string, unknown>) {
    const { skill, mockPayload } = payload;
    if (!skill) throw new Error("Missing skill definition for testing.");

    const { executeDynamicSkill } = await import("../genkit/dynamicFlow");

    try {
        const result = await executeDynamicSkill((skill as Record<string, unknown>) || {}, (mockPayload as Record<string, unknown>) || {});
        return { success: true, result };
    } catch (e) {
        console.error("AI Skill Test Error:", e);
        return { success: false, error: (e as Error).message || "Unknown error occurred" };
    }
}
