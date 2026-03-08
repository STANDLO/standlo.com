import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
initializeApp({ projectId: "standlo" });

const checkDb = async (dbName: string) => {
    console.log(`\n🔍 Checking emulator database: ${dbName || '(default)'}`);
    try {
        const db = getFirestore(dbName === '(default)' ? undefined : dbName);
        const collections = await db.listCollections();
        console.log(`Collections found: ${collections.length}`);
        for (const col of collections) {
            const snap = await col.limit(1).get();
            console.log(`  - ${col.id} (Has docs: ${!snap.empty})`);
        }
    } catch (e) {
        console.error(`Error on ${dbName}:`, e.message);
    }
};

const run = async () => {
    await checkDb('(default)');
    await checkDb('standlo');
};

run().catch(console.error);
