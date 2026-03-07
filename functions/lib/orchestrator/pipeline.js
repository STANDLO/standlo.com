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
exports.createPipelineEntity = createPipelineEntity;
exports.updatePipelineEntity = updatePipelineEntity;
exports.deletePipelineEntity = deletePipelineEntity;
exports.runPipeline = runPipeline;
const firestore_1 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const crypto_1 = require("crypto");
const firestore = (0, firestore_1.getFirestore)((0, app_1.getApp)(), "standlo");
async function createPipelineEntity(uid, payload) {
    const pipelineId = payload.id || (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const pipelineData = Object.assign(Object.assign({ id: pipelineId, orgId: payload.orgId || null, ownId: uid }, payload), { nodes: payload.nodes || [], edges: payload.edges || [], createdAt: now, createdBy: uid, updatedAt: now, updatedBy: uid, deletedAt: null, isArchived: false });
    await firestore.collection("pipelines").doc(pipelineId).set(pipelineData);
    return {
        status: "success",
        message: "Pipeline created successfully.",
        data: { id: pipelineId }
    };
}
async function updatePipelineEntity(uid, pipelineId, payload) {
    const now = new Date().toISOString();
    const restPayload = Object.assign({}, payload);
    delete restPayload.id;
    const updateData = Object.assign(Object.assign({}, restPayload), { updatedAt: now, updatedBy: uid });
    await firestore.collection("pipelines").doc(pipelineId).update(updateData);
    return {
        status: "success",
        message: "Pipeline updated successfully.",
        data: { id: pipelineId }
    };
}
async function deletePipelineEntity(uid, pipelineId) {
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
function interpolateString(str, context) {
    // Matches {{ variable.path }}
    return str.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, path) => {
        const keys = path.split('.');
        let value = context;
        for (const key of keys) {
            if (value === undefined || value === null)
                break;
            value = value[key];
        }
        return value !== undefined ? String(value) : match;
    });
}
function interpolateObject(obj, context) {
    if (typeof obj === 'string') {
        return interpolateString(obj, context);
    }
    else if (Array.isArray(obj)) {
        return obj.map(item => interpolateObject(item, context));
    }
    else if (obj !== null && typeof obj === 'object') {
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
            result[k] = interpolateObject(v, context);
        }
        return result;
    }
    return obj;
}
async function runPipeline(uid, pipelineId, inputContext = {}, isDryRun = true) {
    var _a;
    const doc = await firestore.collection("pipelines").doc(pipelineId).get();
    if (!doc.exists) {
        throw new Error(`Pipeline ${pipelineId} not found.`);
    }
    const pipeline = doc.data();
    const nodes = pipeline.nodes || [];
    const edges = pipeline.edges || [];
    // Runtime variables available to nodes via {{ }}
    const executionContext = {
        input: inputContext,
        nodes: {} // Results of node executions will be stored here: nodes[nodeId].output
    };
    const executionLog = [];
    // 1. Find the Trigger Node(s)
    const triggerNodes = nodes.filter(n => n.type === "trigger");
    if (triggerNodes.length === 0) {
        return { status: "error", message: "No trigger nodes found in pipeline." };
    }
    // 2. Simple BFS or Sequential Runner
    let queue = [...triggerNodes];
    const visited = new Set();
    while (queue.length > 0) {
        const currentNode = queue.shift();
        if (!currentNode)
            continue;
        if (visited.has(currentNode.id))
            continue;
        visited.add(currentNode.id);
        try {
            // Interpolate node config before execution
            const config = interpolateObject(currentNode.data, executionContext);
            let output = { executedAt: new Date().toISOString() };
            let followEdgeId = null; // Used for logic branching
            console.log(`[Pipeline ${pipelineId}] Executing Node ${currentNode.id} (${currentNode.type}) [DryRun: ${isDryRun}]`);
            if (currentNode.type === "trigger") {
                output.echo = "Trigger activated";
            }
            else if (currentNode.type === "logic") {
                const condition = config.condition;
                if (!condition)
                    throw new Error("Logic node missing condition.");
                // Safe evaluation using simple Function constructor on sanitized input
                // WARNING: In a production scenario, use a proper JS interpreter or sandbox (e.g. AST parser)
                try {
                    // Provide a safer wrapper
                    const result = new Function(`return (${condition})`)();
                    output.result = result;
                    followEdgeId = result ? "true" : "false";
                }
                catch (e) {
                    throw new Error(`Failed to evaluate condition '${condition}': ${e.message}`);
                }
            }
            else if (currentNode.type === "action") {
                const actionType = config.actionType;
                const targetPath = config.targetPath; // e.g., 'part', 'stand'
                let payloadObj = {};
                if (config.payload) {
                    try {
                        payloadObj = JSON.parse(config.payload);
                    }
                    catch (e) {
                        throw new Error("Action payload is not valid JSON.");
                    }
                }
                if (!isDryRun) {
                    if (actionType === "orchestrator_create") {
                        if (targetPath === "mesh") {
                            const { createMeshEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/mesh")));
                            output.result = await createMeshEntity(uid, payloadObj);
                        }
                        else if (targetPath === "part") {
                            const { createPartEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/part")));
                            output.result = await createPartEntity(uid, payloadObj);
                        }
                        else if (targetPath === "assembly") {
                            const { createAssemblyEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/assembly")));
                            output.result = await createAssemblyEntity(uid, payloadObj);
                        }
                        else if (targetPath === "bundle") {
                            const { createBundleEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/bundle")));
                            output.result = await createBundleEntity(uid, payloadObj);
                        }
                        else if (targetPath === "stand") {
                            const { createStandEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/stand")));
                            output.result = await createStandEntity(uid, payloadObj);
                        }
                        else {
                            throw new Error(`Unsupported create entity: ${targetPath}`);
                        }
                    }
                    else if (actionType === "orchestrator_update") {
                        if (targetPath === "mesh") {
                            const { updateMeshEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/mesh")));
                            output.result = await updateMeshEntity(uid, payloadObj.id, payloadObj);
                        }
                        else if (targetPath === "part") {
                            const { updatePartEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/part")));
                            output.result = await updatePartEntity(uid, payloadObj.id, payloadObj);
                        }
                        else if (targetPath === "assembly") {
                            const { updateAssemblyEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/assembly")));
                            output.result = await updateAssemblyEntity(uid, payloadObj.id, payloadObj);
                        }
                        else if (targetPath === "bundle") {
                            const { updateBundleEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/bundle")));
                            output.result = await updateBundleEntity(uid, payloadObj.id, payloadObj);
                        }
                        else if (targetPath === "stand") {
                            const { updateStandEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/stand")));
                            output.result = await updateStandEntity(uid, payloadObj.id, payloadObj);
                        }
                        else {
                            throw new Error(`Unsupported update entity: ${targetPath}`);
                        }
                    }
                    else if (actionType === "orchestrator_delete") {
                        if (targetPath === "mesh") {
                            const { deleteMeshEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/mesh")));
                            output.result = await deleteMeshEntity(uid, payloadObj.id);
                        }
                        else if (targetPath === "part") {
                            const { deletePartEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/part")));
                            output.result = await deletePartEntity(uid, payloadObj.id);
                        }
                        else if (targetPath === "assembly") {
                            const { deleteAssemblyEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/assembly")));
                            output.result = await deleteAssemblyEntity(uid, payloadObj.id);
                        }
                        else if (targetPath === "bundle") {
                            const { deleteBundleEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/bundle")));
                            output.result = await deleteBundleEntity(uid, payloadObj.id);
                        }
                        else if (targetPath === "stand") {
                            const { deleteStandEntity } = await Promise.resolve().then(() => __importStar(require("../orchestrator/stand")));
                            output.result = await deleteStandEntity(uid, payloadObj.id);
                        }
                        else {
                            throw new Error(`Unsupported delete entity: ${targetPath}`);
                        }
                    }
                    else if (actionType === "http_request") {
                        // Placeholder for external fetch
                        output.result = `Simulated HTTP request to ${targetPath}`;
                    }
                    else if (actionType === "run_pipeline") {
                        output.result = await runPipeline(uid, targetPath, payloadObj, isDryRun);
                    }
                    else {
                        throw new Error(`Unknown actionType: ${actionType}`);
                    }
                }
                else {
                    output.dryRunAction = {
                        actionType,
                        targetPath,
                        payloadObj
                    };
                }
            }
            else if (currentNode.type === "brain") {
                const skillId = config.skillId;
                if (!skillId)
                    throw new Error("Brain node missing skillId configuration.");
                console.log(`[Pipeline] Brain Node ${currentNode.id} requesting Skill ${skillId}`);
                // Load skill document from Firestore
                const skillDocRef = await firestore.collection("ai_skills").doc(skillId).get();
                if (!skillDocRef.exists) {
                    throw new Error(`AI Skill '${skillId}' not found in database.`);
                }
                const skillDocData = skillDocRef.data();
                // Compute the AI input payload combining statically configured fields and Handlebars interpolations
                let payloadObj = {};
                if (config.payload) {
                    try {
                        payloadObj = JSON.parse(config.payload);
                    }
                    catch (e) {
                        throw new Error(`Brain payload is not valid JSON: ${e.message}`);
                    }
                }
                // Interpolate the mapped payload against the current pipeline context variables
                const evaluatedPayload = interpolateObject(payloadObj, executionContext);
                if (!isDryRun) {
                    // Import dynamically mapped flow
                    const { executeDynamicSkill } = await Promise.resolve().then(() => __importStar(require("../genkit/dynamicFlow")));
                    try {
                        console.log(`[Pipeline] Brain Node ${currentNode.id} executing AI...`);
                        const aiOutput = await executeDynamicSkill(skillDocData, evaluatedPayload);
                        output.result = aiOutput;
                        console.log(`[Pipeline] Brain Node ${currentNode.id} AI execution finished.`);
                    }
                    catch (aiError) {
                        throw new Error(`AI Skill Execution Failed: ${aiError.message}`);
                    }
                }
                else {
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
                if (targetNode)
                    queue.push(targetNode);
            }
        }
        catch (e) {
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
                startedAt: executionLog.length > 0 ? (_a = executionLog[0].output) === null || _a === void 0 ? void 0 : _a.executedAt : new Date().toISOString(),
                completedAt: new Date().toISOString(),
                triggeredBy: uid,
                log: executionLog,
                finalContext: executionContext,
                isArchived: false,
                deletedAt: null
            });
        }
        catch (e) {
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
//# sourceMappingURL=pipeline.js.map