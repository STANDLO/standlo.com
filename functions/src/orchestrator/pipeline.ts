import { getFirestore } from "firebase-admin/firestore";
import { getApp } from "firebase-admin/app";
import { randomUUID } from "crypto";
import { getEntityConfig } from "../gateways/entityRegistry";

const firestore = getFirestore(getApp(), "standlo");

export async function createPipelineEntity(uid: string, payload: Record<string, unknown>) {
    const pipelineId = payload.id as string || randomUUID();
    const now = new Date().toISOString();

    const pipelineData = {
        id: pipelineId,
        orgId: payload.orgId || null,
        ownId: uid,
        ...payload,
        nodes: payload.nodes || [],
        edges: payload.edges || [],
        createdAt: now,
        createdBy: uid,
        updatedAt: now,
        updatedBy: uid,
        deletedAt: null,
        isArchived: false
    };

    await firestore.collection("pipelines").doc(pipelineId).set(pipelineData);

    return {
        status: "success",
        message: "Pipeline created successfully.",
        data: { id: pipelineId }
    };
}

export async function updatePipelineEntity(uid: string, pipelineId: string, payload: Record<string, unknown>) {
    const now = new Date().toISOString();
    const restPayload = { ...payload };
    delete restPayload.id;

    const updateData = {
        ...restPayload,
        updatedAt: now,
        updatedBy: uid
    };

    await firestore.collection("pipelines").doc(pipelineId).update(updateData);

    return {
        status: "success",
        message: "Pipeline updated successfully.",
        data: { id: pipelineId }
    };
}

export async function deletePipelineEntity(uid: string, pipelineId: string) {
    const now = new Date().toISOString();

    // Safe Deletion Protocol: Soft delete by archiving to prevent breakages in active workflows
    await firestore.collection("pipelines").doc(pipelineId).update({
        isArchived: true,
        deletedAt: now,
        updatedBy: uid
    });

    return {
        status: "success",
        message: "Pipeline archived successfully (Safe Deletion).",
        data: { id: pipelineId }
    };
}

// -------------------------------------------------------------
// DAG Interpreter (Phase 2 - Dry Run)
// -------------------------------------------------------------

function interpolateString(str: string, context: Record<string, unknown>): string {
    // Matches {{ variable.path }}
    return str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
        const keys = path.split('.');
        let value: unknown = context;
        for (const key of keys) {
            if (value === undefined || value === null || typeof value !== 'object') break;
            value = (value as Record<string, unknown>)[key];
        }
        return value !== undefined ? String(value) : match;
    });
}

function interpolateObject(obj: unknown, context: Record<string, unknown>): unknown {
    if (typeof obj === 'string') {
        return interpolateString(obj, context);
    } else if (Array.isArray(obj)) {
        return obj.map(item => interpolateObject(item, context));
    } else if (obj !== null && typeof obj === 'object') {
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj)) {
            result[k] = interpolateObject(v, context);
        }
        return result;
    }
    return obj;
}

export async function runPipeline(uid: string, pipelineId: string, inputContext: Record<string, unknown> = {}, isDryRun: boolean = true) {
    const doc = await firestore.collection("pipelines").doc(pipelineId).get();
    if (!doc.exists) {
        throw new Error(`Pipeline ${pipelineId} not found.`);
    }

    const pipeline = doc.data() as Record<string, unknown>;
    const nodes: Record<string, unknown>[] = (pipeline["nodes"] as Record<string, unknown>[]) || [];
    const edges: Record<string, unknown>[] = (pipeline["edges"] as Record<string, unknown>[]) || [];

    // Runtime variables available to nodes via {{ }}
    const executionContext: Record<string, unknown> = {
        ...inputContext,
        input: inputContext, // Kept for backward compatibility if any legacy pipeline uses {{ input.data }}
        nodes: {} // Results of node executions will be stored here: nodes[nodeId].output
    };

    const executionLog: Record<string, unknown>[] = [];

    // 1. Find the Trigger Node(s)
    const triggerNodes = nodes.filter(n => n.type === "trigger");
    if (triggerNodes.length === 0) {
        return { status: "error", message: "No trigger nodes found in pipeline." };
    }

    // 2. Simple BFS or Sequential Runner
    const queue = [...triggerNodes];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const currentNode = queue.shift();
        if (!currentNode) continue;

        if (visited.has(currentNode["id"] as string)) continue;
        visited.add(currentNode["id"] as string);

        try {
            // Interpolate node config before execution
            const config = interpolateObject(currentNode["data"], executionContext) as Record<string, unknown>;
            const output: Record<string, unknown> = { executedAt: new Date().toISOString() };
            let followEdgeId: string | null = null; // Used for logic branching

            const nodeId = currentNode["id"] as string;
            const nodeType = currentNode["type"] as string;
            console.log(`[Pipeline ${pipelineId}] Executing Node ${nodeId} (${nodeType}) [DryRun: ${isDryRun}]`);

            if (nodeType === "trigger") {
                output.echo = "Trigger activated";
            } else if (nodeType === "logic") {
                const condition = config["condition"] as string;
                if (!condition) throw new Error("Logic node missing condition.");

                // Safe evaluation using simple Function constructor on sanitized input
                // WARNING: In a production scenario, use a proper JS interpreter or sandbox (e.g. AST parser)
                try {
                    // Provide a safer wrapper
                    const result = new Function(`return (${condition})`)();
                    output.result = result;
                    followEdgeId = result ? "true" : "false";
                } catch (e: unknown) {
                    throw new Error(`Failed to evaluate condition '${condition}': ${(e as Error).message}`);
                }
            } else if (nodeType === "action") {
                const actionType = config["actionType"] as string;
                const targetPath = config["targetPath"] as string; // e.g., 'part', 'stand'
                let payloadObj: Record<string, unknown> = {};

                if (config["payload"]) {
                    try {
                        payloadObj = JSON.parse(config["payload"] as string);
                    } catch {
                        throw new Error("Action payload is not valid JSON.");
                    }
                }

                if (!isDryRun) {
                    // Pre-fetch entity config to validate targetPath
                    if (actionType.startsWith("orchestrator_")) {
                        try {
                            getEntityConfig(targetPath); // Will throw if not in registry
                        } catch {
                            throw new Error(`Invalid targetPath '${targetPath}' for orchestrator action.`);
                        }
                    }

                    if (actionType === "orchestrator_create") {
                        try {
                            // Try to load specific orchestrator first
                            const entityModule = await import(`../orchestrator/${targetPath}`);
                            const createFnName = `create${targetPath.charAt(0).toUpperCase() + targetPath.slice(1)}Entity`;
                            if (entityModule[createFnName]) {
                                output.result = await entityModule[createFnName](uid, payloadObj);
                            } else {
                                throw new Error("Fallback to generic");
                            }
                        } catch {
                            // Fallback to generic creation if specific orchestrator doesn't exist
                            const { createGenericEntity } = await import("../orchestrator/generic");
                            output.result = await createGenericEntity(targetPath, uid, payloadObj);
                        }
                    } else if (actionType === "orchestrator_update") {
                        try {
                            const entityModule = await import(`../orchestrator/${targetPath}`);
                            const updateFnName = `update${targetPath.charAt(0).toUpperCase() + targetPath.slice(1)}Entity`;
                            if (entityModule[updateFnName]) {
                                output.result = await entityModule[updateFnName](uid, payloadObj["id"] as string, payloadObj);
                            } else {
                                throw new Error("Fallback to generic");
                            }
                        } catch {
                            // Fallback to generic update if specific orchestrator doesn't exist
                            const { updateGenericEntity } = await import("../orchestrator/generic");
                            output.result = await updateGenericEntity(targetPath, uid, payloadObj["id"] as string, payloadObj);
                        }
                    } else if (actionType === "orchestrator_delete") {
                        try {
                            const entityModule = await import(`../orchestrator/${targetPath}`);
                            const deleteFnName = `delete${targetPath.charAt(0).toUpperCase() + targetPath.slice(1)}Entity`;
                            if (entityModule[deleteFnName]) {
                                output.result = await entityModule[deleteFnName](uid, payloadObj["id"] as string);
                            } else {
                                throw new Error("Fallback to generic");
                            }
                        } catch {
                            // Fallback to generic delete if specific orchestrator doesn't exist
                            const { deleteGenericEntity } = await import("../orchestrator/generic");
                            output.result = await deleteGenericEntity(targetPath, uid, payloadObj["id"] as string, payloadObj);
                        }
                    } else if (actionType === "firestore_create") {
                        const newId = (payloadObj["id"] as string) || randomUUID();
                        const now = new Date().toISOString();
                        const ObjectWithId = {
                            id: newId,
                            ownId: uid,
                            ...payloadObj,
                            createdAt: now,
                            createdBy: uid,
                            updatedAt: now,
                            updatedBy: uid,
                            deletedAt: null,
                            isArchived: false
                        };
                        const colRef = firestore.collection(targetPath);
                        await colRef.doc(newId).set(ObjectWithId);
                        output.result = { status: "success", data: { id: newId, path: `${targetPath}/${newId}` } };
                    } else if (actionType === "firestore_update") {
                        if (!payloadObj["id"]) throw new Error("firestore_update requires 'id' in payload");
                        const now = new Date().toISOString();
                        const { id, ...restPayload } = payloadObj;
                        const updateData = {
                            ...restPayload,
                            updatedAt: now,
                            updatedBy: uid
                        };
                        const colRef = firestore.collection(targetPath);
                        await colRef.doc(id as string).update(updateData);
                        output.result = { status: "success", data: { id, path: `${targetPath}/${id}` } };
                    } else if (actionType === "http_request") {
                        // Placeholder for external fetch
                        output.result = `Simulated HTTP request to ${targetPath}`;
                    } else if (actionType === "run_pipeline") {
                        output.result = await runPipeline(uid, targetPath, payloadObj, isDryRun);
                    } else {
                        throw new Error(`Unknown actionType: ${actionType}`);
                    }
                } else {
                    output.dryRunAction = {
                        actionType,
                        targetPath,
                        payloadObj
                    };
                }
            } else if (nodeType === "brain") {
                const skillId = config["skillId"] as string;
                if (!skillId) throw new Error("Brain node missing skillId configuration.");

                console.log(`[Pipeline] Brain Node ${currentNode["id"] as string} requesting Skill ${skillId}`);

                // Load skill document from Firestore
                const skillDocRef = await firestore.collection("ai_skills").doc(skillId).get();
                if (!skillDocRef.exists) {
                    throw new Error(`AI Skill '${skillId}' not found in database.`);
                }
                const skillDocData = skillDocRef.data();

                // Compute the AI input payload combining statically configured fields and Handlebars interpolations
                let payloadObj: Record<string, unknown> = {};
                if (config["payload"]) {
                    try {
                        payloadObj = JSON.parse(config["payload"] as string);
                    } catch (e) {
                        throw new Error(`Brain payload is not valid JSON: ${(e as Error).message}`);
                    }
                }

                // Interpolate the mapped payload against the current pipeline context variables
                const evaluatedPayload = interpolateObject(payloadObj, executionContext);

                if (!isDryRun) {
                    // Import dynamically mapped flow
                    const { executeDynamicSkill } = await import("../genkit/dynamicFlow");

                    try {
                        console.log(`[Pipeline] Brain Node ${currentNode["id"] as string} executing AI...`);
                        const aiOutput = await executeDynamicSkill(skillDocData as Record<string, unknown>, evaluatedPayload as Record<string, unknown>);
                        output.result = aiOutput;
                        console.log(`[Pipeline] Brain Node ${currentNode["id"] as string} AI execution finished.`);
                    } catch (aiError: unknown) {
                        throw new Error(`AI Skill Execution Failed: ${(aiError as Error).message}`);
                    }
                } else {
                    output.dryRunBrain = {
                        skillId,
                        evaluatedPayload
                    };
                }
            }

            // Save output to context for downstream nodes
            (executionContext["nodes"] as Record<string, unknown>)[currentNode["id"] as string] = { output };

            executionLog.push({
                nodeId: currentNode["id"] as string,
                type: nodeType,
                config,
                output,
                status: "success"
            });

            // Find next nodes connected from this node's output
            const outgoingEdges = edges.filter(e => e["source"] === (currentNode["id"] as string));
            for (const edge of outgoingEdges) {
                // If the node specified a specific edge to follow (Logic gate), respect it
                if (nodeType === "logic" && followEdgeId !== null) {
                    if (edge["sourceHandle"] && edge["sourceHandle"] !== followEdgeId) {
                        continue; // Skip the branch that was evaluated to false
                    }
                }
                const targetNode = nodes.find(n => n["id"] === edge["target"]);
                if (targetNode) queue.push(targetNode);
            }

        } catch (e: unknown) {
            console.error(`[Pipeline ${pipelineId}] Node ${currentNode["id"] as string} failed:`, e);
            executionLog.push({
                nodeId: currentNode["id"] as string,
                type: currentNode["type"],
                status: "error",
                error: (e as Error).message
            });
            break; // Stop execution on error
        }
    }

    if (!isDryRun) {
        try {
            await firestore.collection("pipelines_executions").doc(randomUUID()).set({
                pipelineId,
                status: executionLog.some(l => l["status"] === "error") ? "error" : "success",
                startedAt: executionLog.length > 0 ? ((executionLog[0] as Record<string, unknown>)["output"] as Record<string, unknown>)?.["executedAt"] || new Date().toISOString() : new Date().toISOString(),
                completedAt: new Date().toISOString(),
                triggeredBy: uid,
                log: executionLog,
                finalContext: executionContext,
                isArchived: false,
                deletedAt: null
            });
        } catch (e) {
            console.error(`[Pipeline ${pipelineId}] Failed to save execution log:`, e);
        }
    }

    return {
        status: "success",
        message: isDryRun ? "Pipeline Dry Run completed." : "Pipeline executed successfully.",
        data: {
            log: executionLog,
            finalContext: executionContext
        }
    };
}
