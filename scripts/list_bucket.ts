import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';

const serviceAccountPath = path.join(process.cwd(), 'keys', 'standlo-firebase-adminsdk-fbsvc-5a2af63973.json');
const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'standlo.firebasestorage.app'
});

const bucket = getStorage().bucket();

async function list() {
  const [files] = await bucket.getFiles({ prefix: 'public/' });
  for (const file of files) {
    const [metadata] = await file.getMetadata();
    const token = metadata.metadata?.firebaseStorageDownloadTokens || '';
    console.log(`${file.name} - token: ${token}`);
  }
}

list().catch(console.error);
