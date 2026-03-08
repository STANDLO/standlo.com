import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import path from "path";
import fs from "fs";

async function main() {
    const args = process.argv.slice(2);
    const collectionName = args[0];
    const docId = args[1];

    if (!collectionName || !docId) {
        console.error("Missing collection name or document id");
        process.exit(1);
    }

    console.log(`Syncing '${docId}' in collection '${collectionName}' from Local to Prod...`);

    // 1. Init Local
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
    const localApp = initializeApp({ projectId: "standlo" }, "local");
    const localDb = getFirestore(localApp, "standlo");

    const localSnap = await localDb.collection(collectionName).doc(docId).get();
    if (!localSnap.exists) {
        console.error("Document not found in local db");
        process.exit(1);
    }
    const data = localSnap.data();

    if (!data) {
        console.error("Local document has no data");
        process.exit(1);
    }

    // 2. Init Prod
    delete process.env.FIRESTORE_EMULATOR_HOST;
    const keyPath = path.resolve(__dirname, '../keys/standlo-firebase-adminsdk-fbsvc-5a2af63973.json');
    if (!fs.existsSync(keyPath)) {
        console.error(`Production key file not found at ${keyPath}`);
        process.exit(1);
    }

    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    const prodApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: "standlo"
    }, "prod");
    const prodDb = getFirestore(prodApp, "standlo");

    // 3. Sync
    await prodDb.collection(collectionName).doc(docId).set(data);
    console.log(`Successfully synced ${docId} to Production!`);
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
