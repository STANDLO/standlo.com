import { firestore } from "../gateways/firestore";
import * as crypto from "crypto";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { withDLQ } from "./utils/dlq";
import { CanvasObjectSchema } from "../schemas/canvas";
import { CallableRequest } from "firebase-functions/v2/https";
import { GatewayRequest } from "../types";
import { DecodedIdToken } from "firebase-admin/auth";
// Omit ExpressRequest; we'll cast rawRequest appropriately

function createInternalRequest(data: GatewayRequest, uid?: string, orgId?: string): CallableRequest<GatewayRequest> {
    const userId = uid || "system";
    const organizationId = orgId || "system";
    const now = Math.floor(Date.now() / 1000);
    
    const token: DecodedIdToken = {
        email_verified: true,
        auth_time: now,
        exp: now + 3600,
        iat: now,
        iss: "https://securetoken.google.com/standlo-1",
        sub: userId,
        aud: "standlo-1",
        uid: userId,
        orgId: organizationId,
        firebase: { identities: {}, sign_in_provider: "custom" }
    };

    const auth = {
        uid: userId,
        token
    } as unknown as NonNullable<CallableRequest["auth"]>;

    return {
        data,
        auth,
        rawRequest: { rawBody: Buffer.from("") } as unknown as CallableRequest["rawRequest"],
        acceptsStreaming: false
    } as unknown as CallableRequest<GatewayRequest>;
}

/**
 * Saves or updates a canvas entity's objects directly to Firestore using a Batched Write to the `objects` subcollection.
 * It also touches the parent document to update the `updatedAt` field.
 */
export async function saveCanvasEntity(uid: string, targetSchema: string, docId: string, orgId: string, objects: Record<string, unknown>[]) {
    try {
        // 1. Update the parent document's metadata
        await firestore.run(createInternalRequest({
            actionId: "update",
            entityId: targetSchema,
            orgId,
            payload: { id: docId }
        }, uid, orgId)).catch((e: Error) => console.error(`[Choreography][saveCanvasEntity] Parent update failed:`, e));

        // 2. Fetch existing documents to detect deletions
        const listResult = await firestore.run(createInternalRequest({
            actionId: "list",
            entityId: `${targetSchema}/${docId}/objects`,
            orgId,
            limit: 1000
        }, uid, orgId));

        const existingDocs = (listResult && typeof listResult === "object" && "data" in listResult && Array.isArray(listResult.data)) ? listResult.data : [];
        const existingIds = new Set(existingDocs.map((doc: Record<string, unknown>) => String(doc.id)));

        const incomingIds = new Set(
            Array.isArray(objects)
                ? objects.map(o => (o as Record<string, unknown>).id || o.baseEntityId).filter(Boolean) as string[]
                : []
        );

        const promises: Promise<unknown>[] = [];

        // Delete missing (soft_delete)
        existingDocs.forEach((doc: Record<string, unknown>) => {
            if (!incomingIds.has(String(doc.id))) {
                promises.push(
                    firestore.run(createInternalRequest({
                        actionId: "soft_delete",
                        entityId: `${targetSchema}/${docId}/objects`,
                        orgId,
                        payload: { id: doc.id }
                    }, uid, orgId))
                );
            }
        });

        // 3. Iterate through incoming objects and set them in the subcollection
        if (Array.isArray(objects)) {
            objects.forEach((obj, index) => {
                const parsedObject = CanvasObjectSchema.parse({
                    ...obj,
                    order: obj.order ?? index
                });

                const objectDocId = (obj as Record<string, unknown>).id || parsedObject.baseEntityId;
                if (!objectDocId) throw new Error("CanvasObject missing an identifiers");

                const actionId = existingIds.has(objectDocId as string) ? "update" : "create";
                promises.push(
                    firestore.run(createInternalRequest({
                        actionId,
                        entityId: `${targetSchema}/${docId}/objects`,
                        orgId,
                        payload: { ...parsedObject, id: objectDocId }
                    }, uid, orgId))
                );
            });
        }

        await Promise.allSettled(promises);

        return { success: true };
    } catch (error) {
        console.error(`[Choreography][saveCanvasEntity] Error saving objects for ${targetSchema} ${docId}:`, error);
        throw error;
    }
}

// Standard retry configuration and rate limiting for Canvas Operations
const canvasQueueConfig = {
    region: "europe-west1" as const,
    retryConfig: {
        maxAttempts: 3,
        minBackoffSeconds: 5
    },
    rateLimits: {
        maxConcurrentDispatches: 500
    }
};

export const choreographyCanvasCreateSandbox = onTaskDispatched(canvasQueueConfig, async (request) => {
    await withDLQ(request, () => handleCanvasCreateSandbox(request.data));
});

export const choreographyCanvasCreateNode = onTaskDispatched(canvasQueueConfig, async (request) => {
    await withDLQ(request, () => handleCanvasCreateNode(request.data));
});

export const choreographyCanvasUpdateNode = onTaskDispatched(canvasQueueConfig, async (request) => {
    await withDLQ(request, () => handleCanvasUpdateNode(request.data));
});

export const choreographyCanvasDeleteNode = onTaskDispatched(canvasQueueConfig, async (request) => {
    await withDLQ(request, () => handleCanvasDeleteNode(request.data));
});

/**
 * Background Task for Canvas Sandbox Creation
 */
export async function handleCanvasCreateSandbox(payload: Record<string, unknown>) {
    const { canvasId, name, canvasType, editPassword, authUserId, authOrgId, isPublic, mockObjectId } = payload;
    
    if (!canvasId) {
        console.error("[Choreography] Missing canvasId for createSandbox", payload);
        return;
    }

    try {
        let editPasswordHash = null;
        if (editPassword && typeof editPassword === "string") {
            const salt = crypto.randomBytes(16).toString("hex");
            const hash = crypto.scryptSync(editPassword, salt, 64).toString("hex");
            editPasswordHash = `${salt}:${hash}`;
        }

        const canvasPayload = {
            id: canvasId,
            name: name || (isPublic ? "Sandbox Public Canvas" : "My Canvas"),
            type: canvasType || "design",
            ...(editPasswordHash && { editPassword: editPasswordHash })
        };

        await firestore.run(createInternalRequest({
            actionId: "create",
            entityId: "canvas",
            orgId: (authOrgId as string) || "system",
            payload: canvasPayload
        }, authUserId as string, authOrgId as string));

        if (isPublic && mockObjectId) {
            const mockObjectPayload = {
                id: mockObjectId,
                type: "part",
                baseEntityId: mockObjectId, // Using mockObjectId as a safe base for the mock
                name: "Mock Floor",
                layerId: "pavimento",
                position: [0, 0, 0],
                rotation: [0, 0, 0],
                order: 0,
            };

            await firestore.run(createInternalRequest({
                actionId: "create",
                entityId: `canvas/${canvasId}/objects`,
                orgId: (authOrgId as string) || "system",
                payload: mockObjectPayload
            }, authUserId as string, authOrgId as string));
        }
    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error(`[Choreography] Failed to proxy-create canvas sandbox ${canvasId}:`, errorMsg);
        throw e;
    }
}

/**
 * Background Task for Canvas Node Insertion
 * This runs in Choreography as a fire-and-forget process to avoid blocking the frontend UI
 * during massive stress tests or large copy-paste operations.
 */
export async function handleCanvasCreateNode(payload: Record<string, unknown>) {
    const { canvasId, baseEntityId, type, parentId, layerId, position, rotation, metadata, authUserId, authOrgId } = payload;
    
    if (!canvasId || !type) {
        console.error("[Choreography] Missing canvasId or type for createNode", payload);
        return;
    }

    const entityId = `canvas/${canvasId}/objects`; // The registry maps this to "canvases/{canvasId}/objects"
    const newNodeId = crypto.randomUUID();

    const requestData = {
        actionId: "create",
        entityId: entityId,
        orgId: (authOrgId as string) || "system", // Provided from Orchestrator contextual metadata if available
        payload: {
            id: newNodeId,
            baseEntityId: (baseEntityId as string) || "",
            type: type as string,
            parentId: (parentId as string) || null,
            layerId: (layerId as string) || "strutture",
            position: (position as number[]) || [0, 0, 0],
            rotation: (rotation as number[]) || [0, 0, 0], // Note: CanvasObject uses Euler [x,y,z], we adjust if quaternion passed
            metadata: (metadata as Record<string, unknown>) || {}
        }
    };

    // If rotation is passed as a 4D quaternion, just truncate to 3D for Zod Schema (BaseNode expects Euler for position mapping)
    if (Array.isArray(requestData.payload.rotation) && requestData.payload.rotation.length === 4) {
        requestData.payload.rotation = [requestData.payload.rotation[0], requestData.payload.rotation[1], requestData.payload.rotation[2]];
    }

    try {
        // We invoke the internal logic of the Firestore gateway directly using `.run()`.
        // This enforces Zod Validation and standard creation metadata logic natively.
        await firestore.run(createInternalRequest(requestData, authUserId as string, authOrgId as string));

        console.log(`[Choreography] Successfully proxy-inserted node ${newNodeId} into ${entityId}`);
    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error(`[Choreography] Failed to proxy-insert node into ${entityId}:`, errorMsg);
        throw e; // Let Cloud Tasks retry if needed
    }
}

/**
 * Background Task for Canvas Node Updating
 */
export async function handleCanvasUpdateNode(payload: Record<string, unknown>) {
    const { canvasId, nodeId, position, rotation, metadata, parentId, authUserId, authOrgId } = payload;
    
    if (!canvasId || !nodeId) {
        console.error("[Choreography] Missing canvasId or nodeId for updateNode", payload);
        return;
    }

    const entityId = `canvas/${canvasId}/objects`;

    // Only include provided updates
    const updates: Record<string, unknown> = { id: nodeId as string };
    if (position !== undefined) updates.position = position;
    if (rotation !== undefined) updates.rotation = rotation;
    if (metadata !== undefined) updates.metadata = metadata;
    if (parentId !== undefined) updates.parentId = parentId;

    const requestData = {
        actionId: "update",
        entityId: entityId,
        orgId: (authOrgId as string) || "system",
        payload: updates
    };

    if (Array.isArray(requestData.payload.rotation) && requestData.payload.rotation.length === 4) {
        requestData.payload.rotation = [requestData.payload.rotation[0], requestData.payload.rotation[1], requestData.payload.rotation[2]];
    }

    try {
        await firestore.run(createInternalRequest(requestData, authUserId as string, authOrgId as string));

        console.log(`[Choreography] Successfully proxy-updated node ${nodeId} in ${entityId}`);
    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error(`[Choreography] Failed to proxy-update node in ${entityId}:`, errorMsg);
        throw e;
    }
}

/**
 * Background Task for Canvas Node Deletion
 * Note: Performs a soft delete via the internal gateway instead of a hard delete.
 */
export async function handleCanvasDeleteNode(payload: Record<string, unknown>) {
    const { canvasId, nodeId, authUserId, authOrgId } = payload;
    
    if (!canvasId || !nodeId) {
        console.error("[Choreography] Missing canvasId or nodeId for deleteNode", payload);
        return;
    }

    const entityId = `canvas/${canvasId}/objects`;

    try {
        await firestore.run(createInternalRequest({
            actionId: "soft_delete",
            entityId: entityId,
            orgId: (authOrgId as string) || "system",
            payload: { id: nodeId as string }
        }, authUserId as string, authOrgId as string));

        console.log(`[Choreography] Successfully proxy-soft-deleted node ${nodeId} from canvas ${canvasId}`);
    } catch (e: unknown) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        console.error(`[Choreography] Failed to proxy-soft-delete node ${nodeId}:`, errorMsg);
        throw e;
    }
}
