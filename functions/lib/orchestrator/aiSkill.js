"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAISkillEntity = createAISkillEntity;
exports.updateAISkillEntity = updateAISkillEntity;
exports.deleteAISkillEntity = deleteAISkillEntity;
exports.testAISkill = testAISkill;
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const aiSkill_1 = require("../schemas/aiSkill");
// Get specific DB reference
const getDb = () => (0, firestore_1.getFirestore)((0, app_1.getApp)(), "standlo");
async function createAISkillEntity(userId, payload) {
    const db = getDb();
    // Auto-generate ID if missing
    if (!payload.id) {
        payload.id = db.collection('ai_skills').doc().id;
    }
    const { type } = payload, dataWithoutType = __rest(payload, ["type"]);
    // Add base fields
    const enrichedData = Object.assign(Object.assign({}, dataWithoutType), { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: userId, isActive: payload.isActive !== undefined ? payload.isActive : true, isArchived: false });
    const parsed = aiSkill_1.AISkillSchema.parse(enrichedData);
    await db.collection("ai_skills").doc(parsed.id).set(parsed, { merge: true });
    return parsed;
}
async function updateAISkillEntity(userId, id, payload) {
    const db = getDb();
    const { type } = payload, dataWithoutType = __rest(payload, ["type"]);
    const enrichment = Object.assign(Object.assign({}, dataWithoutType), { id, updatedAt: new Date().toISOString(), updatedBy: userId });
    // We fetch current entity to merge it safely before zod parse
    const snap = await db.collection("ai_skills").doc(id).get();
    if (!snap.exists)
        throw new Error("Entity not found");
    const mergedData = Object.assign(Object.assign({}, snap.data()), enrichment);
    const parsed = aiSkill_1.AISkillSchema.parse(mergedData);
    await db.collection("ai_skills").doc(id).set(parsed, { merge: true });
    return parsed;
}
async function deleteAISkillEntity(userId, id) {
    const db = getDb();
    // Soft delete
    await db.collection("ai_skills").doc(id).update({
        isArchived: true,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
    });
    return { success: true };
}
async function testAISkill(userId, payload) {
    const { skill, mockPayload } = payload;
    if (!skill)
        throw new Error("Missing skill definition for testing.");
    const { executeDynamicSkill } = await Promise.resolve().then(() => __importStar(require("../genkit/dynamicFlow")));
    try {
        const result = await executeDynamicSkill(skill, mockPayload || {});
        return { success: true, result };
    }
    catch (e) {
        console.error("AI Skill Test Error:", e);
        return { success: false, error: e.message || "Unknown error occurred" };
    }
}
//# sourceMappingURL=aiSkill.js.map