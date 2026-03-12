const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

const serviceAccount = require('/Users/cristiankalexai/Progetti/standlo.com/keys/standlo-firebase-adminsdk-fbsvc-5a2af63973.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "standlo.firebasestorage.app"
});

const bucket = admin.storage().bucket();

const filesToUpload = [
  { path: '/tmp/favicon-16x16.png', dest: 'public/favicon-16x16.png', contentType: 'image/png' },
  { path: '/tmp/favicon-32x32.png', dest: 'public/favicon-32x32.png', contentType: 'image/png' },
  { path: '/tmp/favicon.ico', dest: 'public/favicon.ico', contentType: 'image/x-icon' },
  { path: '/tmp/android-chrome-192x192.png', dest: 'public/android-chrome-192x192.png', contentType: 'image/png' },
  { path: '/tmp/android-chrome-512x512.png', dest: 'public/android-chrome-512x512.png', contentType: 'image/png' },
  { path: '/tmp/apple-touch-icon.png', dest: 'public/apple-touch-icon.png', contentType: 'image/png' }
];

async function uploadAll() {
  for (const fileObj of filesToUpload) {
    const token = uuidv4();
    await bucket.upload(fileObj.path, {
      destination: fileObj.dest,
      metadata: {
        contentType: fileObj.contentType,
        metadata: {
          firebaseStorageDownloadTokens: token
        }
      }
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileObj.dest)}?alt=media&token=${token}`;
    console.log(`${fileObj.dest}: ${url}`);
  }
}

uploadAll().catch(console.error);
