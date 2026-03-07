"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipelineTriggers = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const app_1 = require("firebase-admin/app");
const pipeline_1 = require("../orchestrator/pipeline");
const secrets_1 = require("../core/secrets");
const db = (0, firestore_2.getFirestore)((0, app_1.getApp)(), "standlo");
// Simple in-memory cache to avoid reading the pipelines collection on every single database write.
// In a highly concurrent environment, this will save thousands of reads.
let cachedPipelines = [];
let lastCacheUpdate = 0;
const CACHE_TTL_MS = 60000; // 1 minute
async function getActiveDatabasePipelines() {
    const now = Date.now();
    if (now - lastCacheUpdate < CACHE_TTL_MS && cachedPipelines.length > 0) {
        return cachedPipelines;
    }
    try {
        const snapshot = await db.collection("pipelines").where("isActive", "==", true).get();
        cachedPipelines = snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        // We only care about pipelines that have a firestore_event trigger
        cachedPipelines = cachedPipelines.filter(p => p.nodes.some(n => { var _a; return n.type === "trigger" && ((_a = n.data) === null || _a === void 0 ? void 0 : _a.triggerType) === "firestore_event"; }));
        lastCacheUpdate = now;
        return cachedPipelines;
    }
    catch (e) {
        console.error("Failed to fetch active pipelines for triggers", e);
        return cachedPipelines; // return stale cache if available
    }
}
/**
 * Global Firestore Observer for Database Triggers.
 * Listens to all root-level collections.
 */
exports.pipelineTriggers = (0, firestore_1.onDocumentWritten)({
    document: "{collectionId}/{docId}",
    database: "standlo",
    namespace: "{namespaceId}", // Workaround for Firestore Enterprise "namespace filter" bug
    region: "europe-west4",
    secrets: [secrets_1.geminiApiKey]
}, async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const collectionId = event.params.collectionId;
    const docId = event.params.docId;
    // 1. Blacklist internal collections to prevent infinite loops and reduce noise
    const ignoredCollections = ["pipelines", "pipelines_executions", "users", "_system"];
    if (ignoredCollections.includes(collectionId)) {
        return;
    }
    const pipelines = await getActiveDatabasePipelines();
    if (pipelines.length === 0)
        return;
    // Determine the type of event for the trigger conditions
    let eventType = "update";
    if (!((_a = event.data) === null || _a === void 0 ? void 0 : _a.before.exists) && ((_b = event.data) === null || _b === void 0 ? void 0 : _b.after.exists)) {
        eventType = "create";
    }
    else if (((_c = event.data) === null || _c === void 0 ? void 0 : _c.before.exists) && !((_d = event.data) === null || _d === void 0 ? void 0 : _d.after.exists)) {
        eventType = "delete";
    }
    const docData = ((_e = event.data) === null || _e === void 0 ? void 0 : _e.after.data()) || ((_f = event.data) === null || _f === void 0 ? void 0 : _f.before.data());
    // 2. Check each pipeline to see if it should trigger
    for (const pipeline of pipelines) {
        const triggerNodes = pipeline.nodes.filter(n => { var _a; return n.type === "trigger" && ((_a = n.data) === null || _a === void 0 ? void 0 : _a.triggerType) === "firestore_event"; });
        for (const trigger of triggerNodes) {
            const configColl = (_g = trigger.data) === null || _g === void 0 ? void 0 : _g.collection;
            const configEvent = ((_h = trigger.data) === null || _h === void 0 ? void 0 : _h.triggerEvent) || "all";
            // If the collection doesn't match, or the event doesn't match, skip
            if (configColl !== collectionId)
                continue;
            if (configEvent !== "all" && configEvent !== eventType)
                continue;
            // Prepare context
            const executionContext = {
                triggerType: "firestore_event",
                eventType,
                collectionId,
                docId,
                data: docData,
                previousData: ((_j = event.data) === null || _j === void 0 ? void 0 : _j.before.data()) || null
            };
            console.log(`[FirestoreTrigger] Triggering pipeline ${pipeline.id} on ${eventType} in ${collectionId}/${docId}`);
            // Execute as SYSTEM user
            await (0, pipeline_1.runPipeline)("system", pipeline.id, executionContext, false);
        }
    }
});
//# sourceMappingURL=firestoreTriggers.js.map