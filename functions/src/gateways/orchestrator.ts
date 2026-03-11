import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GatewayRequest } from "../types";
import { geminiApiKey } from "../core/secrets";
import { onboardOrganization } from "../orchestrator/organization";

export const orchestrator = onCall({
    region: "europe-west4",
    secrets: [geminiApiKey],
    enforceAppCheck: process.env.FUNCTIONS_EMULATOR === "true" ? false : true,
    cors: process.env.FUNCTIONS_EMULATOR === "true" ? true : ["https://standlo.com", "https://www.standlo.com"],
    consumeAppCheckToken: false,
}, async (request) => {
    const data = request.data as GatewayRequest;
    const { correlationId, idempotencyKey, orgId, userId, roleId, entityId, actionId, payload } = data;

    // 1. Mandatory Auth check for mutating actions
    const publicActions = ["list", "read"];
    if (!request.auth && !publicActions.includes(actionId)) {
        throw new HttpsError("unauthenticated", `User must be authenticated to access Orchestrator action: ${actionId}`);
    }

    const resolvedOrgId = orgId || request.auth?.token?.orgId || "system";
    const uid = request.auth?.uid || "public";
    const resolvedRoleId = roleId || (request.auth ? "customer" : "guest");

    // Log the initiation of the workflow tracing it with correlationId
    console.log(`[Orchestrator][${correlationId || 'no-corr-id'}] Action: ${actionId} on Entity: ${entityId} started by User: ${uid}`);
    console.log(`[Orchestrator] Details: orgId=${orgId}, resolvedOrgId=${resolvedOrgId}, userId=${userId}, resolvedRoleId=${resolvedRoleId}, idempotencyKey=${idempotencyKey}, payload=${!!payload}`);

    // TODO: Verify idempotencyKey against Firestore 'idempotency_locks' to prevent duplicated logic execution

    // --- ROUTER START ---
    if (actionId === "auth_event") {
        if (!payload) {
            throw new HttpsError("invalid-argument", "Payload is required for auth events.");
        }

        let ipAddress: string | undefined;
        const forwardedFor = request.rawRequest.headers['x-forwarded-for'];
        if (typeof forwardedFor === 'string') {
            ipAddress = forwardedFor.split(',')[0].trim();
        } else if (Array.isArray(forwardedFor)) {
            ipAddress = forwardedFor[0].trim();
        } else {
            ipAddress = request.rawRequest.socket?.remoteAddress;
        }

        const userAgent = request.rawRequest.headers['user-agent'];

        const { handleAuthEvent } = await import("../orchestrator/auth");
        return handleAuthEvent(uid, ipAddress, userAgent, payload as Record<string, unknown>);
    }

    if (actionId === "onboard_organization") {
        if (!payload) {
            throw new HttpsError("invalid-argument", "Payload is required for onboarding.");
        }
        return onboardOrganization(uid, payload as Record<string, unknown>);
    }

    if (actionId === "activate_user") {
        if (!payload) {
            throw new HttpsError("invalid-argument", "Payload is required to activate user.");
        }
        const { activateUser } = await import("../orchestrator/admin");
        return activateUser(uid, payload as Record<string, unknown>);
    }

    if (actionId === "get_admin_kpis") {
        const { getAdminKpis } = await import("../orchestrator/admin");
        return getAdminKpis(uid);
    }

    if (actionId === "run_pipeline_test") {
        if (!payload || !payload.id) {
            throw new HttpsError("invalid-argument", "Pipeline ID is required to run a test.");
        }
        const { runPipeline } = await import("../orchestrator/pipeline");
        return runPipeline(uid, payload.id as string, (payload.context as Record<string, unknown>) || {});
    }
    if (actionId === "create_entity") {
        if (!payload) {
            throw new HttpsError("invalid-argument", "Payload is required to create entity.");
        }

        const payloadRec = payload as Record<string, unknown>;
        if (!payloadRec.orgId) {
            payloadRec.orgId = resolvedOrgId;
        }

        if (entityId === "part") {
            const { createPartEntity } = await import("../orchestrator/part");
            return createPartEntity(uid, payloadRec);
        }
        if (entityId === "assembly") {
            const { createAssemblyEntity } = await import("../orchestrator/assembly");
            return createAssemblyEntity(uid, payloadRec);
        }
        if (entityId === "stand") {
            const { createStandEntity } = await import("../orchestrator/stand");
            return createStandEntity(uid, payloadRec);
        }
        if (entityId === "process") {
            const { createProcessEntity } = await import("../orchestrator/process");
            return createProcessEntity(uid, payloadRec);
        }
        if (entityId === "tool") {
            const { createToolEntity } = await import("../orchestrator/tool");
            return createToolEntity(uid, payloadRec);
        }
        if (entityId === "mesh") {
            const { createMeshEntity } = await import("../orchestrator/mesh");
            return createMeshEntity(uid, payloadRec);
        }
        if (entityId === "bundle") {
            const { createBundleEntity } = await import("../orchestrator/bundle");
            return createBundleEntity(uid, payloadRec);
        }
        if (entityId === "pipeline") {
            const { createPipelineEntity } = await import("../orchestrator/pipeline");
            return createPipelineEntity(uid, payloadRec);
        }
        if (entityId === "ai_skill") {
            const { createAISkillEntity } = await import("../orchestrator/aiSkill");
            return createAISkillEntity(uid, payloadRec);
        }
        if (entityId === "organizationUser") {
            const { createOrganizationUserEntity } = await import("../orchestrator/organizationUser");
            return createOrganizationUserEntity(uid, payloadRec);
        }
        throw new HttpsError("invalid-argument", `Unsupported entity type: ${entityId}`);
    }

    if (actionId === "update_entity") {
        if (!entityId || !payload) {
            throw new HttpsError("invalid-argument", "Entity ID and Payload are required to update entity.");
        }
        // payload should contain the document ID as `id`, or we can pass it separately.
        // But if the client is calling orchestrator specifically, it will pass `id` inside `payload`.
        const docId = (payload as Record<string, unknown>).id as string;
        if (!docId) throw new HttpsError("invalid-argument", "Payload must contain document 'id'.");

        if (entityId === "part") {
            const { updatePartEntity } = await import("../orchestrator/part");
            return updatePartEntity(uid, docId, payload as Record<string, unknown>);
        }
        if (entityId === "assembly") {
            const { updateAssemblyEntity } = await import("../orchestrator/assembly");
            return updateAssemblyEntity(uid, docId, payload as Record<string, unknown>);
        }
        if (entityId === "stand") {
            const { updateStandEntity } = await import("../orchestrator/stand");
            return updateStandEntity(uid, docId, payload as Record<string, unknown>);
        }
        if (entityId === "process") {
            const { updateProcessEntity } = await import("../orchestrator/process");
            return updateProcessEntity(uid, docId, payload as Record<string, unknown>);
        }
        if (entityId === "tool") {
            const { updateToolEntity } = await import("../orchestrator/tool");
            return updateToolEntity(uid, docId, payload as Record<string, unknown>);
        }
        if (entityId === "mesh") {
            const { updateMeshEntity } = await import("../orchestrator/mesh");
            return updateMeshEntity(uid, docId, payload as Record<string, unknown>);
        }
        if (entityId === "bundle") {
            const { updateBundleEntity } = await import("../orchestrator/bundle");
            return updateBundleEntity(uid, docId, payload as Record<string, unknown>);
        }
        if (entityId === "pipeline") {
            const { updatePipelineEntity } = await import("../orchestrator/pipeline");
            return updatePipelineEntity(uid, docId, payload as Record<string, unknown>);
        }
        if (entityId === "ai_skill") {
            const { updateAISkillEntity } = await import("../orchestrator/aiSkill");
            return updateAISkillEntity(uid, docId, payload as Record<string, unknown>);
        }
        if (entityId === "organizationUser") {
            const { updateOrganizationUserEntity } = await import("../orchestrator/organizationUser");
            return updateOrganizationUserEntity(uid, docId, payload as Record<string, unknown>);
        }
        throw new HttpsError("invalid-argument", `Unsupported entity for update: ${entityId}`);
    }

    if (actionId === "delete_entity") {
        const payloadRec = payload as Record<string, unknown> | undefined;
        if (!entityId || !payloadRec?.id) {
            throw new HttpsError("invalid-argument", "Entity ID and document 'id' (in payload) are required to delete entity.");
        }
        const docId = payloadRec.id as string;

        // --- Safe Deletion Protocol ---
        const collectionMap: Record<string, string> = {
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
            const { checkSafeDeletion } = await import("../core/correlate");
            const { getFirestore } = await import("firebase-admin/firestore");
            const { getApp } = await import("firebase-admin/app");
            const db = getFirestore(getApp(), "standlo");
            await checkSafeDeletion(db, colName, docId);
        }
        // ------------------------------


        if (entityId === "part") {
            const { deletePartEntity } = await import("../orchestrator/part");
            return deletePartEntity(uid, docId);
        }
        if (entityId === "assembly") {
            const { deleteAssemblyEntity } = await import("../orchestrator/assembly");
            return deleteAssemblyEntity(uid, docId);
        }
        if (entityId === "stand") {
            const { deleteStandEntity } = await import("../orchestrator/stand");
            return deleteStandEntity(uid, docId);
        }
        if (entityId === "process") {
            const { deleteProcessEntity } = await import("../orchestrator/process");
            return deleteProcessEntity(uid, docId);
        }
        if (entityId === "tool") {
            const { deleteToolEntity } = await import("../orchestrator/tool");
            return deleteToolEntity(uid, docId);
        }
        if (entityId === "mesh") {
            const { deleteMeshEntity } = await import("../orchestrator/mesh");
            return deleteMeshEntity(uid, docId);
        }
        if (entityId === "bundle") {
            const { deleteBundleEntity } = await import("../orchestrator/bundle");
            return deleteBundleEntity(uid, docId);
        }
        if (entityId === "pipeline") {
            const { deletePipelineEntity } = await import("../orchestrator/pipeline");
            return deletePipelineEntity(uid, docId);
        }
        if (entityId === "ai_skill") {
            const { deleteAISkillEntity } = await import("../orchestrator/aiSkill");
            return deleteAISkillEntity(uid, docId);
        }
        if (entityId === "organizationUser") {
            const { deleteOrganizationUserEntity } = await import("../orchestrator/organizationUser");
            return deleteOrganizationUserEntity(uid, docId, payloadRec);
        }
        throw new HttpsError("invalid-argument", `Unsupported entity for delete: ${entityId}`);
    }

    if (actionId === "list") {
        const { listEntities } = await import("../orchestrator/queries");
        return listEntities(uid, entityId as string, orgId as string | undefined, payload as Record<string, unknown>);
    }

    if (actionId === "read") {
        const payloadRec = payload as Record<string, unknown> | undefined;
        if (!entityId || !payloadRec?.id) {
            throw new HttpsError("invalid-argument", "Entity ID and document 'id' are required to read entity.");
        }
        const docId = payloadRec.id as string;
        const { readEntity } = await import("../orchestrator/queries");
        return readEntity(uid, entityId, docId);
    }

    if (actionId === "get_assembly_details") {
        const payloadRec = payload as Record<string, unknown> | undefined;
        if (!payloadRec?.id) throw new HttpsError("invalid-argument", "Payload must contain document 'id'.");
        const { getAssemblyDetailsEntity } = await import("../orchestrator/assembly");
        return getAssemblyDetailsEntity(uid, payloadRec.id as string);
    }

    if (actionId === "get_bundle_details") {
        const payloadRec = payload as Record<string, unknown> | undefined;
        if (!payloadRec?.id) throw new HttpsError("invalid-argument", "Payload must contain document 'id'.");
        const { getBundleDetailsEntity } = await import("../orchestrator/bundle");
        return getBundleDetailsEntity(uid, payloadRec.id as string);
    }

    if (actionId === "get_stand_details") {
        const payloadRec = payload as Record<string, unknown> | undefined;
        if (!payloadRec?.id) throw new HttpsError("invalid-argument", "Payload must contain document 'id'.");
        const { getStandDetailsEntity } = await import("../orchestrator/stand");
        return getStandDetailsEntity(uid, payloadRec.id as string);
    }

    if (actionId === "execute_pipeline") {
        const payloadRec = payload as Record<string, unknown> | undefined;
        if (!payloadRec?.pipelineId) throw new HttpsError("invalid-argument", "Payload must contain 'pipelineId'.");

        const { runPipeline } = await import("../orchestrator/pipeline");
        return runPipeline(
            uid,
            payloadRec.pipelineId as string,
            (payloadRec.inputContext as Record<string, unknown>) || {},
            payloadRec.isDryRun === true
        );
    }

    if (actionId === "test_ai_skill") {
        const { testAISkill } = await import("../orchestrator/aiSkill");
        return testAISkill(uid, payload as Record<string, unknown>);
    }
    // --- ROUTER END ---

    return {
        status: "success",
        message: "Orchestrator finished successfully (No operation matched)",
        actionId,
    };
});
