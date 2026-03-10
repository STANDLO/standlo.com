import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import fs from 'fs';

// Initialize Firebase Admin using the existing service account key
const serviceAccountPath = path.join(process.cwd(), 'keys', 'standlo-firebase-adminsdk-fbsvc-5a2af63973.json');
const serviceAccount = require(serviceAccountPath);

initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'standlo.appspot.com'
});

const bucket = getStorage().bucket();

async function uploadFiles() {
    const publicDir = path.join(process.cwd(), 'public');
    const files = fs.readdirSync(publicDir);

    console.log(`🚀 Starting upload to gs://standlo.appspot.com/standlo/brand/web/ ...`);
    for (const file of files) {
        const filePath = path.join(publicDir, file);
        if (fs.statSync(filePath).isFile() && !file.startsWith('.')) {
            const destPath = `standlo/brand/web/${file}`;
            console.log(`Uploading ${file}...`);
            await bucket.upload(filePath, {
                destination: destPath,
                metadata: {
                    cacheControl: 'public, max-age=31536000'
                }
            });
            console.log(`✅ Uploaded ${file}`);
        }
    }
    console.log(`🎉 All assets successfully uploaded to Firebase Storage.`);
}

uploadFiles().catch(console.error);
