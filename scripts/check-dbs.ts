import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const initAdmin = () => {
    const keyPath = path.resolve(__dirname, '../keys/standlo-firebase-adminsdk-fbsvc-5a2af63973.json');
    if (!fs.existsSync(keyPath)) {
        throw new Error(`Production key file not found at ${keyPath}`);
    }
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    initializeApp({
        credential: cert(serviceAccount),
        projectId: "standlo"
    });
};

const checkDb = async (dbName: string) => {
    console.log(`\n🔍 Checking database: ${dbName || '(default)'}`);
    const db = getFirestore(dbName === '(default)' ? undefined : dbName);
    const collections = await db.listCollections();
    console.log(`Collections found: ${collections.length}`);
    for (const col of collections) {
        const snap = await col.limit(1).get();
        console.log(`  - ${col.id} (Has docs: ${!snap.empty})`);
    }
};

const run = async () => {
    initAdmin();
    await checkDb('standlo');
};

run().catch(console.error);
