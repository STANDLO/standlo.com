import { CloudTasksClient } from '@google-cloud/tasks';

// Ensure to only initialize on the server-side
const isServer = typeof window === 'undefined';

let client: CloudTasksClient | null = null;

if (isServer) {
    client = new CloudTasksClient();
}

/**
 * Enqueues a payload to a specific Google Cloud Tasks queue.
 * @param queueName The ID of the target queue (e.g., 'dcode-async-processor')
 * @param payload The data to be sent to the worker
 * @param functionUrl The exact HTTPS trigger URL of the target Cloud Function (fallback if queue target is abstract)
 */
export async function enqueueCloudTask(queueName: string, payload: any, functionUrl: string) {
    if (!client) {
        throw new Error("CloudTasksClient cannot be initialized on the client-side.");
    }

    const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const location = 'europe-west1'; // Align with V2 deployment

    if (!project) throw new Error("GCP Project ID missing from Env.");

    // Construct the fully qualified queue name
    const parent = client.queuePath(project, location, queueName);

    const task = {
        httpRequest: {
            httpMethod: 'POST' as const,
            url: functionUrl,
            headers: {
                'Content-Type': 'application/json',
                // Optional: Inject explicit AppCheck Auth headers if the target enforces it strongly via raw HTTP
            },
            body: Buffer.from(JSON.stringify(payload)).toString('base64'),
        },
    };

    console.log(`[CloudTasks] Sending payload to queue: ${parent}`);

    try {
        const [response] = await client.createTask({ parent, task });
        console.log(`[CloudTasks] Created task ${response.name}`);
        return response;
    } catch (error) {
        console.error(`[CloudTasks] Error creating task:`, error);
        throw error;
    }
}
