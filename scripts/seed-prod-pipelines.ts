import { Firestore } from "@google-cloud/firestore";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ID = "standlo";

// Disconnect from local emulator to force production target
delete process.env.FIRESTORE_EMULATOR_HOST;

const prodDb = new Firestore({
    projectId: PROJECT_ID,
    databaseId: "standlo",
    keyFilename: "keys/standlo-firebase-adminsdk-fbsvc-5a2af63973.json" // standard production key used in sync-production
});

async function forceSeedPipelines() {
    console.log("🚀 Starting Forced Seeding of Pipelines to Production...");
    const pipelinesDir = path.resolve(process.cwd(), "seed/pipelines");
    const files = fs.readdirSync(pipelinesDir).filter(f => f.endsWith(".json"));

    const batch = prodDb.batch();
    let count = 0;

    for (const file of files) {
        const filePath = path.join(pipelinesDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const docId = data.id;

        if (!docId) {
            console.warn(`⚠️ Skipping ${file}: No 'id' provided in JSON.`);
            continue;
        }

        const ref = prodDb.collection("pipelines").doc(docId);
        // Using merge: true OR set() to overwrite and guarantee the latest nodes/edges are in prod
        batch.set(ref, data);
        console.log(`✅ Staged pipeline overwrite: ${docId}`);
        count++;
    }

    if (count > 0) {
        await batch.commit();
        console.log(`\n🎉 Successfully forced ${count} pipelines into Production!`);
    } else {
        console.log("\n⏭️ No pipeline files found in seed/pipelines.");
    }
}

forceSeedPipelines().catch(console.error);
