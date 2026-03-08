import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// Import individual seeders
import { seedLocalAdmin } from './admin/index.mjs';

// Initialize Firebase Admin without credentials 
// When FIREBASE_AUTH_EMULATOR_HOST is set, this works smoothly
if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'standlo' });
}

async function runAllSeeds() {
    console.log('\n--- Starting Local Database Seeding ---');

    try {
        // 1. Seed Admin User
        await seedLocalAdmin();

        // Target the correct database explicitly ("standlo" instead of default)
        const db = getFirestore(admin.app(), 'standlo');

        // 2. Seed JSON collections
        const seedDirectories = [
            { path: path.join(process.cwd(), 'seed', 'pipelines'), collection: 'pipelines' },
            { path: path.join(process.cwd(), 'seed', 'ai_skills'), collection: 'ai_skills' }
        ];

        for (const { path: dirPath, collection } of seedDirectories) {
            if (fs.existsSync(dirPath)) {
                const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
                if (files.length > 0) {
                    console.log(`[Seed] Processing ${collection} (${files.length} files)...`);
                }
                for (const file of files) {
                    try {
                        const filePath = path.join(dirPath, file);
                        const fileContent = fs.readFileSync(filePath, 'utf8');
                        const data = JSON.parse(fileContent);
                        if (data.id) {
                            await db.collection(collection).doc(data.id).set(data);
                            console.log(`[Seed] \tInjected ${collection}/${data.id} from ${file}`);
                        } else {
                            console.warn(`[Seed] \tSkipping ${filePath} (no "id" field)`);
                        }
                    } catch (err) {
                        console.error(`[Seed] \tFailed to parse and inject JSON from ${file}:`, err);
                    }
                }
            }
        }

        console.log('--- Seeding Completed Successfully ---\n');
        process.exit(0);
    } catch (error) {
        console.error('\n--- Seeding Failed ---');
        console.error(error);
        process.exit(1);
    }
}

runAllSeeds();
