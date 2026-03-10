import { initializeApp, cert, getApp, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';

async function listUrls() {
    const serviceAccountPath = path.join(process.cwd(), 'keys', 'standlo-firebase-adminsdk-fbsvc-5a2af63973.json');
    const serviceAccount = require(serviceAccountPath);

    if (getApps().length === 0) {
        initializeApp({
            credential: cert(serviceAccount),
            storageBucket: 'standlo.firebasestorage.app'
        });
    }

    const bucket = getStorage().bucket();
    const [files] = await bucket.getFiles({ prefix: 'public/' });

    const urls: Record<string, string> = {};

    for (const file of files) {
        // skip folders
        if (file.name.endsWith('/')) continue;

        // Only looking for 'public/icon_X.png' or 'public/logo_X.png'
        const match = file.name.match(/^public\/(icon|logo)_([a-zA-Z0-9_-]+)\.(png|webp)$/);
        if (match) {
            const type = match[1]; // icon or logo
            const color = match[2];

            const [metadata] = await file.getMetadata();
            const token = metadata.metadata?.firebaseStorageDownloadTokens || '';

            let url = `https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/${encodeURIComponent(file.name)}?alt=media`;
            if (token) {
                url += `&token=${token}`;
            }

            const key = `${type}_${color}`;
            urls[key] = url;
        }
    }

    console.log("URLS_JSON_START");
    console.log(JSON.stringify(urls, null, 2));
    console.log("URLS_JSON_END");
}

listUrls().catch(console.error);
