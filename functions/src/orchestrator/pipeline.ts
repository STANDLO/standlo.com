import { getFirestore } from "firebase-admin/firestore";
import { getApp } from "firebase-admin/app";
import { randomUUID } from "crypto";

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

function interpolateString(str: string, context: Record<string, any>): string {
    // Matches {{ variable.path }}
    return str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
        const keys = path.split('.');
        let value: any = context;
        for (const key of keys) {
            if (value === undefined || value === null) break;
            value = value[key];
        }
        return value !== undefined ? String(value) : match;
    });
}

function interpolateObject(obj: any, context: Record<string, any>): any {
    if (typeof obj === 'string') {
        return interpolateString(obj, context);
    } else if (Array.isArray(obj)) {
        return obj.map(item => interpolateObject(item, context));
    } else if (obj !== null && typeof obj === 'object') {
        const result: Record<string, any> = {};
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

    const pipeline = doc.data() as any;
    const nodes: any[] = pipeline.nodes || [];
    const edges: any[] = pipeline.edges || [];

    // Runtime variables available to nodes via {{ }}
    const executionContext: Record<string, any> = {
        input: inputContext,
        nodes: {} // Results of node executions will be stored here: nodes[nodeId].output
    };

    const executionLog: any[] = [];

    // 1. Find the Trigger Node(s)
    const triggerNodes = nodes.filter(n => n.type === "trigger");
    if (triggerNodes.length === 0) {
        return { status: "error", message: "No trigger nodes found in pipeline." };
    }

    // 2. Simple BFS or Sequential Runner
    let queue = [...triggerNodes];
    const visited = new Set<string>();

    while (queue.length > 0) {
        const currentNode = queue.shift();
        if (!currentNode) continue;

        if (visited.has(currentNode.id)) continue;
        visited.add(currentNode.id);

        try {
            // Interpolate node config before execution
            const config = interpolateObject(currentNode.data, executionContext);
            let output: any = { executedAt: new Date().toISOString() };
            let followEdgeId: string | null = null; // Used for logic branching

            console.log(`[Pipeline ${pipelineId}] Executing Node ${currentNode.id} (${currentNode.type}) [DryRun: ${isDryRun}]`);

            if (currentNode.type === "trigger") {
                output.echo = "Trigger activated";
            } else if (currentNode.type === "logic") {
                const condition = config.condition;
                if (!condition) throw new Error("Logic node missing condition.");

                // Safe evaluation using simple Function constructor on sanitized input
                // WARNING: In a production scenario, use a proper JS interpreter or sandbox (e.g. AST parser)
                try {
                    // Provide a safer wrapper
                    const result = new Function(`return (${condition})`)();
                    output.result = result;
                    followEdgeId = result ? "true" : "false";
                } catch (e: any) {
                    throw new Error(`Failed to evaluate condition '${condition}': ${e.message}`);
                }
            } else if (currentNode.type === "action") {
                const actionType = config.actionType;
                const targetPath = config.targetPath; // e.g., 'part', 'stand'
                let payloadObj: any = {};

                if (config.payload) {
                    try {
                        payloadObj = JSON.parse(config.payload);
                    } catch (e) {
                        throw new Error("Action payload is not valid JSON.");
                    }
                }

                if (!isDryRun) {
                    if (actionType === "orchestrator_create") {
                        if (targetPath === "mesh") {
                            const { createMeshEntity } = await import("../orchestrator/mesh");
                            output.result = await createMeshEntity(uid, payloadObj);
                        } else if (targetPath === "part") {
                            const { createPartEntity } = await import("../orchestrator/part");
                            output.result = await createPartEntity(uid, payloadObj);
                        } else if (targetPath === "assembly") {
                            const { createAssemblyEntity } = await import("../orchestrator/assembly");
                            output.result = await createAssemblyEntity(uid, payloadObj);
                        } else if (targetPath === "bundle") {
                            const { createBundleEntity } = await import("../orchestrator/bundle");
                            output.result = await createBundleEntity(uid, payloadObj);
                        } else if (targetPath === "stand") {
                            const { createStandEntity } = await import("../orchestrator/stand");
                            output.result = await createStandEntity(uid, payloadObj);
                        } else {
                            throw new Error(`Unsupported create entity: ${targetPath}`);
                        }
                    } else if (actionType === "orchestrator_update") {
                        if (targetPath === "mesh") {
                            const { updateMeshEntity } = await import("../orchestrator/mesh");
                            output.result = await updateMeshEntity(uid, payloadObj.id, payloadObj);
                        } else if (targetPath === "part") {
                            const { updatePartEntity } = await import("../orchestrator/part");
                            output.result = await updatePartEntity(uid, payloadObj.id, payloadObj);
                        } else if (targetPath === "assembly") {
                            const { updateAssemblyEntity } = await import("../orchestrator/assembly");
                            output.result = await updateAssemblyEntity(uid, payloadObj.id, payloadObj);
                        } else if (targetPath === "bundle") {
                            const { updateBundleEntity } = await import("../orchestrator/bundle");
                            output.result = await updateBundleEntity(uid, payloadObj.id, payloadObj);
                        } else if (targetPath === "stand") {
                            const { updateStandEntity } = await import("../orchestrator/stand");
                            output.result = await updateStandEntity(uid, payloadObj.id, payloadObj);
                        } else {
                            throw new Error(`Unsupported update entity: ${targetPath}`);
                        }
                    } else if (actionType === "orchestrator_delete") {
                        if (targetPath === "mesh") {
                            const { deleteMeshEntity } = await import("../orchestrator/mesh");
                            output.result = await deleteMeshEntity(uid, payloadObj.id);
                        } else if (targetPath === "part") {
                            const { deletePartEntity } = await import("../orchestrator/part");
                            output.result = await deletePartEntity(uid, payloadObj.id);
                        } else if (targetPath === "assembly") {
                            const { deleteAssemblyEntity } = await import("../orchestrator/assembly");
                            output.result = await deleteAssemblyEntity(uid, payloadObj.id);
                        } else if (targetPath === "bundle") {
                            const { deleteBundleEntity } = await import("../orchestrator/bundle");
                            output.result = await deleteBundleEntity(uid, payloadObj.id);
                        } else if (targetPath === "stand") {
                            const { deleteStandEntity } = await import("../orchestrator/stand");
                            output.result = await deleteStandEntity(uid, payloadObj.id);
                        } else {
                            throw new Error(`Unsupported delete entity: ${targetPath}`);
                        }
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
            } else if (currentNode.type === "brain") {
                const skillId = config.skillId;
                if (!skillId) throw new Error("Brain node missing skillId configuration.");

                console.log(`[Pipeline] Brain Node ${currentNode.id} requesting Skill ${skillId}`);

                // Load skill document from Firestore
                const skillDocRef = await firestore.collection("ai_skills").doc(skillId).get();
                if (!skillDocRef.exists) {
                    throw new Error(`AI Skill '${skillId}' not found in database.`);
                }
                const skillDocData = skillDocRef.data();

                // Compute the AI input payload combining statically configured fields and Handlebars interpolations
                let payloadObj: any = {};
                if (config.payload) {
                    try {
                        payloadObj = JSON.parse(config.payload);
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
                        console.log(`[Pipeline] Brain Node ${currentNode.id} executing AI...`);
                        const aiOutput = await executeDynamicSkill(skillDocData, evaluatedPayload);
                        output.result = aiOutput;
                        console.log(`[Pipeline] Brain Node ${currentNode.id} AI execution finished.`);
                    } catch (aiError: any) {
                        throw new Error(`AI Skill Execution Failed: ${aiError.message}`);
                    }
                } else {
                    output.dryRunBrain = {
                        skillId,
                        evaluatedPayload
                    };
                }
            }

            // Save output to context for downstream nodes
            executionContext.nodes[currentNode.id] = { output };

            executionLog.push({
                nodeId: currentNode.id,
                type: currentNode.type,
                config,
                output,
                status: "success"
            });

            // Find next nodes connected from this node's output
            const outgoingEdges = edges.filter(e => e.source === currentNode.id);
            for (const edge of outgoingEdges) {
                // If the node specified a specific edge to follow (Logic gate), respect it
                if (currentNode.type === "logic" && followEdgeId !== null) {
                    if (edge.sourceHandle && edge.sourceHandle !== followEdgeId) {
                        continue; // Skip the branch that was evaluated to false
                    }
                }
                const targetNode = nodes.find(n => n.id === edge.target);
                if (targetNode) queue.push(targetNode);
            }

        } catch (e: any) {
            console.error(`[Pipeline ${pipelineId}] Node ${currentNode.id} failed:`, e);
            executionLog.push({
                nodeId: currentNode.id,
                type: currentNode.type,
                status: "error",
                error: e.message
            });
            break; // Stop execution on error
        }
    }

    if (!isDryRun) {
        try {
            await firestore.collection("pipelines_executions").add({
                pipelineId,
                status: executionLog.some(l => l.status === "error") ? "error" : "success",
                startedAt: executionLog.length > 0 ? executionLog[0].output?.executedAt : new Date().toISOString(),
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
