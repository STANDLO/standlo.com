import { Firestore } from "@google-cloud/firestore";

const PROJECT_ID = "standlo";

// Ensure we don't accidentally use the global emulator host for Prod
delete process.env.FIRESTORE_EMULATOR_HOST;

const prodDb = new Firestore({
    projectId: PROJECT_ID,
    databaseId: "standlo",
    keyFilename: "keys/standlo-firebase-adminsdk-fbsvc-5a2af63973.json"
});

const localDb = new Firestore({
    projectId: PROJECT_ID,
    databaseId: "standlo",
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

        console.log(`🔍 Checking existing documents in production for ${coll}...`);
        const prodDocs = await prodDb.collection(coll).select().get();
        const existingProdIds = new Set(prodDocs.docs.map(d => d.id));

        const batch = prodDb.batch();
        let added = 0;

        snapshot.forEach(doc => {
            if (!existingProdIds.has(doc.id)) {
                batch.set(prodDb.collection(coll).doc(doc.id), doc.data());
                added++;
            }
        });

        if (added > 0) {
            await batch.commit();
            console.log(`✅ Push complete! Added ${added} NEW documents to Production [${coll}].`);
        } else {
            console.log(`⏭️ No new documents to add for [${coll}]. All ${snapshot.size} local docs already exist in prod.`);
        }
    }
    console.log("\n🎉 Sync Complete! The cloud database is now up to date with your local changes.");
}
sync().catch(console.error);
