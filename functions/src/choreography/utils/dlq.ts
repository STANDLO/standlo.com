import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as admin from "firebase-admin";
import { Request } from "firebase-functions/v2/tasks";

/**
 * Wraps a choreography handler with a Dead Letter Queue (DLQ) mechanism.
 * If the handler throws an error and the task has exhausted its retries,
 * the payload and error are logged to `admin/security/dlq` for manual inspection.
 */
export async function withDLQ<T = unknown>(
    request: Request<T>,
    handler: () => Promise<void>,
    maxAttempts: number = 3
): Promise<void> {
    try {
        await handler();
    } catch (error) {
        const retryCountStr = request.headers?.['x-cloudtasks-taskretrycount'] as string || '0';
        const retryCount = parseInt(retryCountStr, 10);
        
        // If this is the last attempt (retryCount starts at 0)
        if (retryCount >= maxAttempts - 1) {
            try {
                const db = getFirestore(admin.app(), "standlo");
                await db.collection("admin/security/dlq").add({
                    taskName: request.headers?.['x-cloudtasks-taskname'] || 'unknown',
                    queueName: request.headers?.['x-cloudtasks-queuename'] || 'unknown',
                    retryCount,
                    payload: JSON.stringify(request.data || {}),
                    errorMessage: error instanceof Error ? error.message : String(error),
                    createdAt: FieldValue.serverTimestamp(),
                    isArchived: false
                });
            } catch (dlqError) {
                console.error("[DLQ] Failed to write to Dead Letter Queue:", dlqError);
            }
        }

        // Always re-throw so Cloud Tasks knows it failed and applies backoff
        throw error;
    }
}
