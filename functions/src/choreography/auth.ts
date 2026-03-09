import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { AuthEvent } from "../schemas/auth";
import { randomUUID } from "node:crypto";

/**
 * Records an authentication event in the Firestore "auth" collection.
 * Features a fast-bounce deduplication check (10 seconds) for the same event type and sessionId/uid.
 */
export async function recordAuthEvent(event: AuthEvent): Promise<void> {
    if (admin.apps.length === 0) return;

    const db = getFirestore(admin.app(), "standlo");
    const authCollection = db.collection("auths");

    // Deduplication check window: 10 seconds ago
    const tenSecondsAgo = new Date(Date.now() - 10000);

    // Build the query
    let query = authCollection
        .where("type", "==", event.type)
        .where("createdAt", ">=", tenSecondsAgo);

    if (event.sessionId) {
        query = query.where("sessionId", "==", event.sessionId);
    } else {
        query = query.where("uid", "==", event.uid);
    }

    try {
        const recentEvents = await query.limit(1).get();

        if (!recentEvents.empty) {
            console.log(`[AuthChoreography] Deduplicated ${event.type} event for uid: ${event.uid}`);
            return; // Skip writing the event
        }

        // Write the event
        const docRef = authCollection.doc(randomUUID());
        const baseDoc = {
            id: docRef.id,
            active: true,
            version: 1,
            code: `AUTH-${Date.now().toString().slice(-6)}`,
            createdAt: new Date(),
            createdBy: "system",
        };

        await docRef.set({
            ...baseDoc,
            ...event
        });

        console.log(`[AuthChoreography] Logged ${event.type} event for uid: ${event.uid} (Session: ${event.sessionId})`);
    } catch (error) {
        console.error(`[AuthChoreography] Error recording auth event:`, error);
        // We do not throw to prevent blocking the Orchestrator
    }
}
