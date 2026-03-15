import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Initialize standard Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Standard Config for V2 Core Functions
const functionConfig = {
    region: "europe-west1",
    enforceAppCheck: false // TODO: Switch to true once AppCheck keys are fully stable in all environments
};

/**
 * 1. DCODE Auth (dcodeAuth)
 * Exclusive pipeline for handling Login, Registration, Session Refresh and Auth Corelation.
 */
export const dcodeAuth = onCall(functionConfig, async (request) => {
    const payload = request.data;
    
    // Logging just to trace the V2 routing success
    console.info("[dcodeAuth] Invoked with payload:", payload);

    try {
        // Implement V2 Auth routing logic based on actionId (read=login, write=register, update=refresh, delete=logout)
        switch (payload.actionId) {
            case "write":
                // Logic: Register & Sync AuthCreateDbSchema
                break;
            case "read":
                // Logic: Login & Sync AuthReadDbSchema
                break;
            case "update":
                // Logic: Refresh Token
                break;
            case "delete":
                // Logic: Logout
                break;
            default:
                throw new HttpsError("invalid-argument", "Unsupported auth action.");
        }

        return { 
            success: true, 
            message: `Auth Sandbox passed over action: ${payload.actionId}`, 
            execution: "auth",
            dcodeId: "auth-uuid"
        };
    } catch (error: any) {
        console.error("[dcodeAuth] Error:", error);
        throw new HttpsError("internal", error.message);
    }
});

/**
 * 2. DCODE Async (dcodeAsync)
 * Fire-And-Forget pipeline for heavy computation, Genkit LLM integrations, and robust delayed Background tasks.
 */
export const dcodeAsync = onCall(functionConfig, async (request) => {
    const payload = request.data;

    console.info("[dcodeAsync] Invoked with payload:", payload);

    try {
        // Here we can either execute immediate asynchronous/heavy code or drop a message into Cloud Tasks
        
        return { 
            success: true, 
            message: "Async Job queued to V2 background processor", 
            execution: "async",
            dcodeId: "async-uuid"
        };
    } catch (error: any) {
        console.error("[dcodeAsync] Error:", error);
        throw new HttpsError("internal", error.message);
    }
});

/**
 * 3. DCODE Sync (dcodeSync)
 * Fast, atomic read/write pipeline directly connected to Firestore for instant state mutations and queries.
 */
export const dcodeSync = onCall(functionConfig, async (request) => {
    const payload = request.data;

    console.info("[dcodeSync] Invoked with payload:", payload);

    try {
        if (payload.actionId === "list" && payload.moduleId === "design" && payload.entityId) {
            const designDoc = await db.collection("designs").doc(payload.entityId).get();
            if (!designDoc.exists) {
                throw new HttpsError("not-found", "Design non trovato");
            }
            // Fetch deep subcollections... (To be refactored using internal db utils)
            const subcollections = ["parts", "processes", "assemblies", "bundles", "objects", "materials", "textures"];
            const results: Record<string, any[]> = {};
            
            await Promise.all(subcollections.map(async (sub) => {
                const snap = await db.collection("designs").doc(payload.entityId).collection(sub).get();
                results[sub] = snap.docs.map(d => d.data());
            }));

            return {
                success: true,
                execution: "sync",
                dcodeId: "sync-uuid",
                data: {
                   ...designDoc.data(),
                   ...results
                }
            };
        }

        return { 
            success: true, 
            message: "Sync CRUD executed", 
            execution: "sync",
            dcodeId: "sync-uuid"
        };
    } catch (error: any) {
        console.error("[dcodeSync] Error:", error);
        throw new HttpsError("internal", error.message);
    }
});

// ============================================================================
// 4. IDENTITY PLATFORM (AUTH) LYFECYCLE HOOKS
// ============================================================================
export { onBeforeUserCreated, onBeforeUserSignedIn } from "./auth";
