import { onDocumentWritten, DocumentOptions } from "firebase-functions/v2/firestore";
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

const triggerOptions: DocumentOptions = { document: "{collectionId}/{docId}", database: "standlo", namespace: "{namespaceId}", region: "europe-west4", secrets: [geminiApiKey] };
const subTriggerOptions: DocumentOptions = { document: "{collectionId}/{docId}/{subCollectionId}/{subDocId}", database: "standlo", namespace: "{namespaceId}", region: "europe-west4", secrets: [geminiApiKey] };

function isPathMatch(configPattern: string, actualPath: string): boolean {
    if (!configPattern || !actualPath) return false;
    if (configPattern === actualPath) return true;

    const patternSegments = configPattern.split('/');
    const actualSegments = actualPath.split('/');

    // If it's a root collection, config might just be "users" but actualPath is "users/123"
    // So if pattern is 1 segment (e.g. "users"), we match if actualPath starts with "users/" and is 2 segments
    if (patternSegments.length === 1 && actualSegments.length === 2) {
        return patternSegments[0] === actualSegments[0];
    }

    if (patternSegments.length !== actualSegments.length) return false;

    for (let i = 0; i < patternSegments.length; i++) {
        const pSeg = patternSegments[i];
        const aSeg = actualSegments[i];

        if (pSeg.startsWith('{') && pSeg.endsWith('}')) {
            continue; // wildcard matches
        }
        if (pSeg !== aSeg) {
            return false;
        }
    }
    return true;
}

async function processPipelineTrigger(
    pathString: string,
    eventType: "create" | "update" | "delete",
    docData: Record<string, unknown> | null,
    previousData: Record<string, unknown> | null
) {
    const pipelines = await getActiveDatabasePipelines();
    if (pipelines.length === 0) return;

    for (const pipeline of pipelines) {
        const triggerNodes = pipeline.nodes.filter(n => n.type === "trigger" && n.data?.triggerType === "firestore_event");

        for (const trigger of triggerNodes) {
            const configColl = trigger.data?.collection as string;
            const configEvent = (trigger.data?.triggerEvent as string) || "all";

            const isMatch = isPathMatch(configColl, pathString);

            if (!isMatch) continue;
            if (configEvent !== "all" && configEvent !== eventType) continue;

            const executionContext = {
                triggerType: "firestore_event",
                eventType,
                collectionId: pathString,
                docId: pathString.split('/').pop(),
                data: docData,
                previousData
            };

            console.log(`[FirestoreTrigger] Triggering pipeline ${pipeline.id} on ${eventType} in ${pathString}`);

            // Execute as SYSTEM user
            await runPipeline("system", pipeline.id!, executionContext, false);
        }
    }
}

/**
 * Global Firestore Observer for Database Triggers.
 * Listens to all root-level collections. 
 */
export const pipelineTriggers = onDocumentWritten(triggerOptions, async (event) => {
    const collectionId = event.params.collectionId;
    const docId = event.params.docId;

    const ignoredCollections = ["pipelines", "pipelines_executions", "users", "_system"];
    if (ignoredCollections.includes(collectionId)) return;

    let eventType: "create" | "update" | "delete" = "update";
    if (!event.data?.before.exists && event.data?.after.exists) eventType = "create";
    else if (event.data?.before.exists && !event.data?.after.exists) eventType = "delete";

    const docData = event.data?.after.data() || event.data?.before.data();
    await processPipelineTrigger(`${collectionId}/${docId}`, eventType, (docData || null) as Record<string, unknown> | null, (event.data?.before.data() || null) as Record<string, unknown> | null);
});

/**
 * Subcollection Observer for Database Triggers.
 * Listens to depths up to 2 layers deep.
 */
export const pipelineSubTriggers = onDocumentWritten(subTriggerOptions, async (event) => {
    const { collectionId, docId, subCollectionId, subDocId } = event.params;

    const ignoredCollections = ["pipelines", "pipelines_executions", "users", "_system"];
    if (ignoredCollections.includes(collectionId)) return;

    let eventType: "create" | "update" | "delete" = "update";
    if (!event.data?.before.exists && event.data?.after.exists) eventType = "create";
    else if (event.data?.before.exists && !event.data?.after.exists) eventType = "delete";

    const docData = event.data?.after.data() || event.data?.before.data();
    await processPipelineTrigger(`${collectionId}/${docId}/${subCollectionId}/${subDocId}`, eventType, (docData || null) as Record<string, unknown> | null, (event.data?.before.data() || null) as Record<string, unknown> | null);
});

const isLocal = process.env.FUNCTIONS_EMULATOR === "true" || !!process.env.FIRESTORE_EMULATOR_HOST || process.env.GCLOUD_PROJECT === "demo-standlo";

// Bypass for Eventarc impossible triad bug: The CLI requires a namespace, but passing {namespaceId} 
// or custom namespaces crashes the local HTTP emulator. We MUST inject (default) metadata locally.
if (isLocal && (pipelineTriggers as unknown as Record<string, unknown>).__endpoint) {
    const endpoint = (pipelineTriggers as unknown as Record<string, unknown>).__endpoint as Record<string, unknown>;
    const eventTrigger = endpoint.eventTrigger as Record<string, unknown>;
    const eventFilters = (eventTrigger.eventFilters || {}) as Record<string, unknown>;

    endpoint.eventTrigger = {
        ...eventTrigger,
        eventFilters: {
            ...eventFilters,
            namespace: "(default)"
        }
    };
}

if (isLocal && (pipelineSubTriggers as unknown as Record<string, unknown>).__endpoint) {
    const endpoint = (pipelineSubTriggers as unknown as Record<string, unknown>).__endpoint as Record<string, unknown>;
    const eventTrigger = endpoint.eventTrigger as Record<string, unknown>;
    const eventFilters = (eventTrigger.eventFilters || {}) as Record<string, unknown>;

    endpoint.eventTrigger = {
        ...eventTrigger,
        eventFilters: {
            ...eventFilters,
            namespace: "(default)"
        }
    };
}

