import { Firestore } from "@google-cloud/firestore";

const PROJECT_ID = "standlo";

// Ensure we don't accidentally use the global emulator host for Prod
delete process.env.FIRESTORE_EMULATOR_HOST;

const prodDb = new Firestore({
    projectId: PROJECT_ID,
});

const localDb = new Firestore({
    projectId: PROJECT_ID,
    host: "127.0.0.1:8080",
    ssl: false,
});

async function sync() {
    console.log("🚀 Starting Local -> Production Sync for Entities...");
    const collections = [
        "pipelines",
        "ai_skills",
        "meshes",
        "parts",
        "assemblies",
        "bundles",
        "stands",
        "processes",
        "tools"
    ];

    for (const coll of collections) {
        console.log(`\n⏳ Syncing [${coll}]...`);
        const snapshot = await localDb.collection(coll).get();
        if (snapshot.empty) {
            console.log(`ℹ️ No documents found for ${coll} locally. Skipping.`);
            continue;
        }

        const batch = prodDb.batch();
        let total = 0;

        snapshot.forEach(doc => {
            batch.set(prodDb.collection(coll).doc(doc.id), doc.data());
            total++;
        });

        await batch.commit();
        console.log(`✅ Push complete! Synced ${total} documents to Production [${coll}].`);
    }
    console.log("\n🎉 Sync Complete! The cloud database is now up to date with your local changes.");
}
sync().catch(console.error);
