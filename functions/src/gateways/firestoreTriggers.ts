import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";
import { getApp } from "firebase-admin/app";
import { runPipeline } from "../orchestrator/pipeline";
import { geminiApiKey } from "../core/secrets";
import { PipelineEntity } from "../schemas/pipeline";

const db = getFirestore(getApp(), "standlo");

// Simple in-memory cache to avoid reading the pipelines collection on every single database write.
// In a highly concurrent environment, this will save thousands of reads.
let cachedPipelines: PipelineEntity[] = [];
let lastCacheUpdate = 0;
const CACHE_TTL_MS = 60000; // 1 minute

async function getActiveDatabasePipelines(): Promise<PipelineEntity[]> {
    const now = Date.now();
    if (now - lastCacheUpdate < CACHE_TTL_MS && cachedPipelines.length > 0) {
        return cachedPipelines;
    }

    try {
        const snapshot = await db.collection("pipelines").where("isActive", "==", true).get();
        cachedPipelines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PipelineEntity));
        // We only care about pipelines that have a firestore_event trigger
        cachedPipelines = cachedPipelines.filter(p =>
            p.nodes.some(n => n.type === "trigger" && n.data?.triggerType === "firestore_event")
        );
        lastCacheUpdate = now;
        return cachedPipelines;
    } catch (e) {
        console.error("Failed to fetch active pipelines for triggers", e);
        return cachedPipelines; // return stale cache if available
    }
}

/**
 * Global Firestore Observer for Database Triggers.
 * Listens to all root-level collections. 
 */
export const pipelineTriggers = onDocumentWritten({
    document: "{collectionId}/{docId}",
    database: "standlo",
    namespace: "{namespaceId}", // Workaround for Firestore Enterprise "namespace filter" bug
    region: "europe-west4",
    secrets: [geminiApiKey]
}, async (event) => {
    const collectionId = event.params.collectionId;
    const docId = event.params.docId;

    // 1. Blacklist internal collections to prevent infinite loops and reduce noise
    const ignoredCollections = ["pipelines", "pipelines_executions", "users", "_system"];
    if (ignoredCollections.includes(collectionId)) {
        return;
    }

    const pipelines = await getActiveDatabasePipelines();
    if (pipelines.length === 0) return;

    // Determine the type of event for the trigger conditions
    let eventType: "create" | "update" | "delete" = "update";
    if (!event.data?.before.exists && event.data?.after.exists) {
        eventType = "create";
    } else if (event.data?.before.exists && !event.data?.after.exists) {
        eventType = "delete";
    }

    const docData = event.data?.after.data() || event.data?.before.data();

    // 2. Check each pipeline to see if it should trigger
    for (const pipeline of pipelines) {
        const triggerNodes = pipeline.nodes.filter(n => n.type === "trigger" && n.data?.triggerType === "firestore_event");

        for (const trigger of triggerNodes) {
            const configColl = trigger.data?.collection as string;
            const configEvent = (trigger.data?.triggerEvent as string) || "all";

            // If the collection doesn't match, or the event doesn't match, skip
            if (configColl !== collectionId) continue;
            if (configEvent !== "all" && configEvent !== eventType) continue;

            // Prepare context
            const executionContext = {
                triggerType: "firestore_event",
                eventType,
                collectionId,
                docId,
                data: docData,
                previousData: event.data?.before.data() || null
            };

            console.log(`[FirestoreTrigger] Triggering pipeline ${pipeline.id} on ${eventType} in ${collectionId}/${docId}`);

            // Execute as SYSTEM user
            await runPipeline("system", pipeline.id!, executionContext, false);
        }
    }
});
