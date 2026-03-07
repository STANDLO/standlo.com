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
Object.defineProperty(exports, "__esModule", { value: true });
exports.orchestrator = void 0;
const https_1 = require("firebase-functions/v2/https");
const secrets_1 = require("../core/secrets");
const organization_1 = require("../orchestrator/organization");
exports.orchestrator = (0, https_1.onCall)({
    region: "europe-west4",
    secrets: [secrets_1.geminiApiKey],
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR === "true" ? false : true,
    cors: process.env.FUNCTIONS_EMULATOR === "true" ? true : ["https://standlo.com", "https://www.standlo.com"],
    consumeAppCheckToken: false,
}, async (request) => {
    // 1. Mandatory Auth check
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be authenticated to access Orchestrator.");
    }
    const data = request.data;
    const { correlationId, idempotencyKey, orgId, userId, roleId, entityId, actionId, payload } = data;
    // Log the initiation of the workflow tracing it with correlationId
    console.log(`[Orchestrator][${correlationId || 'no-corr-id'}] Action: ${actionId} on Entity: ${entityId} started by User: ${request.auth.uid}`);
    console.log(`[Orchestrator] Details: orgId=${orgId}, userId=${userId}, roleId=${roleId}, idempotencyKey=${idempotencyKey}, payload=${!!payload}`);
    // TODO: Verify idempotencyKey against Firestore 'idempotency_locks' to prevent duplicated logic execution
    // --- ROUTER START ---
    if (actionId === "onboard_organization") {
        if (!payload) {
            throw new https_1.HttpsError("invalid-argument", "Payload is required for onboarding.");
        }
        return (0, organization_1.onboardOrganization)(request.auth.uid, payload);
    }
    if (actionId === "activate_user") {
        if (!payload) {
            throw new https_1.HttpsError("invalid-argument", "Payload is required to activate user.");
        }
        const { activateUser } = await Promise.resolve().then(() => __importStar(require("../orchestrator/admin")));
        return activateUser(request.auth.uid, payload);
    }
    if (actionId === "get_admin_kpis") {
        const { getAdminKpis } = await Promise.resolve().then(() => __importStar(require("../orchestrator/admin")));
        return getAdminKpis(request.auth.uid);
    }
    if (actionId === "run_pipeline_test") {
        if (!payload || !payload.id) {
            throw new https_1.HttpsError("invalid-argument", "Pipeline ID is required to run a test.");
        }
        const { runPipeline } = await Promise.resolve().then(() => __importStar(require("../orchestrator/pipeline")));
        return runPipeline(request.auth.uid, payload.id, payload.context || {});
    }
    if (actionId === "create_entity") {
        if (!payload || !payload.type) {
            throw new https_1.HttpsError("invalid-argument", "Payload and payload.type are required to create entity.");
        }
        if (payload.type === "part") {
            const { createPartEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/part")));
            return createPartEntity(request.auth.uid, payload);
        }
        if (payload.type === "assembly") {
            const { createAssemblyEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/assembly")));
            return createAssemblyEntity(request.auth.uid, payload);
        }
        if (payload.type === "stand") {
            const { createStandEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/stand")));
            return createStandEntity(request.auth.uid, payload);
        }
        if (payload.type === "process") {
            const { createProcessEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/process")));
            return createProcessEntity(request.auth.uid, payload);
        }
        if (payload.type === "tool") {
            const { createToolEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/tool")));
            return createToolEntity(request.auth.uid, payload);
        }
        if (payload.type === "mesh") {
            const { createMeshEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/mesh")));
            return createMeshEntity(request.auth.uid, payload);
        }
        if (payload.type === "bundle") {
            const { createBundleEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/bundle")));
            return createBundleEntity(request.auth.uid, payload);
        }
        if (payload.type === "pipeline") {
            const { createPipelineEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/pipeline")));
            return createPipelineEntity(request.auth.uid, payload);
        }
        if (payload.type === "ai_skill") {
            const { createAISkillEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/aiSkill")));
            return createAISkillEntity(request.auth.uid, payload);
        }
        throw new https_1.HttpsError("invalid-argument", `Unsupported entity type: ${payload.type}`);
    }
    if (actionId === "update_entity") {
        if (!entityId || !payload) {
            throw new https_1.HttpsError("invalid-argument", "Entity ID and Payload are required to update entity.");
        }
        // payload should contain the document ID as `id`, or we can pass it separately.
        // But if the client is calling orchestrator specifically, it will pass `id` inside `payload`.
        const docId = payload.id;
        if (!docId)
            throw new https_1.HttpsError("invalid-argument", "Payload must contain document 'id'.");
        if (entityId === "part") {
            const { updatePartEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/part")));
            return updatePartEntity(request.auth.uid, docId, payload);
        }
        if (entityId === "assembly") {
            const { updateAssemblyEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/assembly")));
            return updateAssemblyEntity(request.auth.uid, docId, payload);
        }
        if (entityId === "stand") {
            const { updateStandEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/stand")));
            return updateStandEntity(request.auth.uid, docId, payload);
        }
        if (entityId === "process") {
            const { updateProcessEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/process")));
            return updateProcessEntity(request.auth.uid, docId, payload);
        }
        if (entityId === "tool") {
            const { updateToolEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/tool")));
            return updateToolEntity(request.auth.uid, docId, payload);
        }
        if (entityId === "mesh") {
            const { updateMeshEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/mesh")));
            return updateMeshEntity(request.auth.uid, docId, payload);
        }
        if (entityId === "bundle") {
            const { updateBundleEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/bundle")));
            return updateBundleEntity(request.auth.uid, docId, payload);
        }
        if (entityId === "pipeline") {
            const { updatePipelineEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/pipeline")));
            return updatePipelineEntity(request.auth.uid, docId, payload);
        }
        if (entityId === "ai_skill") {
            const { updateAISkillEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/aiSkill")));
            return updateAISkillEntity(request.auth.uid, docId, payload);
        }
        throw new https_1.HttpsError("invalid-argument", `Unsupported entity for update: ${entityId}`);
    }
    if (actionId === "delete_entity") {
        const payloadRec = payload;
        if (!entityId || !(payloadRec === null || payloadRec === void 0 ? void 0 : payloadRec.id)) {
            throw new https_1.HttpsError("invalid-argument", "Entity ID and document 'id' (in payload) are required to delete entity.");
        }
        const docId = payloadRec.id;
        // --- Safe Deletion Protocol ---
        const collectionMap = {
            part: "parts",
            assembly: "assemblies",
            stand: "stands",
            process: "processes",
            tool: "tools",
            mesh: "meshes",
            bundle: "bundles",
            ai_skill: "ai_skills"
        };
        const colName = collectionMap[entityId];
        if (colName) {
            const { checkSafeDeletion } = await Promise.resolve().then(() => __importStar(require("../core/correlate")));
            const { getFirestore } = await Promise.resolve().then(() => __importStar(require("firebase-admin/firestore")));
            const { getApp } = await Promise.resolve().then(() => __importStar(require("firebase-admin/app")));
            const db = getFirestore(getApp(), "standlo");
            await checkSafeDeletion(db, colName, docId);
        }
        // ------------------------------
        if (entityId === "part") {
            const { deletePartEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/part")));
            return deletePartEntity(request.auth.uid, docId);
        }
        if (entityId === "assembly") {
            const { deleteAssemblyEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/assembly")));
            return deleteAssemblyEntity(request.auth.uid, docId);
        }
        if (entityId === "stand") {
            const { deleteStandEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/stand")));
            return deleteStandEntity(request.auth.uid, docId);
        }
        if (entityId === "process") {
            const { deleteProcessEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/process")));
            return deleteProcessEntity(request.auth.uid, docId);
        }
        if (entityId === "tool") {
            const { deleteToolEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/tool")));
            return deleteToolEntity(request.auth.uid, docId);
        }
        if (entityId === "mesh") {
            const { deleteMeshEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/mesh")));
            return deleteMeshEntity(request.auth.uid, docId);
        }
        if (entityId === "bundle") {
            const { deleteBundleEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/bundle")));
            return deleteBundleEntity(request.auth.uid, docId);
        }
        if (entityId === "pipeline") {
            const { deletePipelineEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/pipeline")));
            return deletePipelineEntity(request.auth.uid, docId);
        }
        if (entityId === "ai_skill") {
            const { deleteAISkillEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/aiSkill")));
            return deleteAISkillEntity(request.auth.uid, docId);
        }
        throw new https_1.HttpsError("invalid-argument", `Unsupported entity for delete: ${entityId}`);
    }
    if (actionId === "list") {
        const { listEntities } = await Promise.resolve().then(() => __importStar(require("../orchestrator/queries")));
        return listEntities(request.auth.uid, entityId, payload);
    }
    if (actionId === "read") {
        const payloadRec = payload;
        if (!entityId || !(payloadRec === null || payloadRec === void 0 ? void 0 : payloadRec.id)) {
            throw new https_1.HttpsError("invalid-argument", "Entity ID and document 'id' are required to read entity.");
        }
        const docId = payloadRec.id;
        const { readEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/queries")));
        return readEntity(request.auth.uid, entityId, docId);
    }
    if (actionId === "get_assembly_details") {
        const payloadRec = payload;
        if (!(payloadRec === null || payloadRec === void 0 ? void 0 : payloadRec.id))
            throw new https_1.HttpsError("invalid-argument", "Payload must contain document 'id'.");
        const { getAssemblyDetailsEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/assembly")));
        return getAssemblyDetailsEntity(request.auth.uid, payloadRec.id);
    }
    if (actionId === "get_bundle_details") {
        const payloadRec = payload;
        if (!(payloadRec === null || payloadRec === void 0 ? void 0 : payloadRec.id))
            throw new https_1.HttpsError("invalid-argument", "Payload must contain document 'id'.");
        const { getBundleDetailsEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/bundle")));
        return getBundleDetailsEntity(request.auth.uid, payloadRec.id);
    }
    if (actionId === "get_stand_details") {
        const payloadRec = payload;
        if (!(payloadRec === null || payloadRec === void 0 ? void 0 : payloadRec.id))
            throw new https_1.HttpsError("invalid-argument", "Payload must contain document 'id'.");
        const { getStandDetailsEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/stand")));
        return getStandDetailsEntity(request.auth.uid, payloadRec.id);
    }
    if (actionId === "test_ai_skill") {
        const { testAISkill } = await Promise.resolve().then(() => __importStar(require("../orchestrator/aiSkill")));
        return testAISkill(request.auth.uid, payload);
    }
    // --- ROUTER END ---
    return {
        status: "success",
        message: "Orchestrator finished successfully (No operation matched)",
        actionId,
    };
});
//# sourceMappingURL=orchestrator.js.map