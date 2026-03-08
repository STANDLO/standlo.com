const { getApp, getApps, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'standlo';

if (!getApps().length) {
    initializeApp({ projectId: 'standlo' });
}
const db = getFirestore('standlo');

async function fix() {
    const docRef = db.collection('pipelines').doc('onboard-warehouse-pipeline');
    const doc = await docRef.get();
    if (doc.exists) {
        console.log('Doc exists!', doc.data().name);
        await docRef.update({
            deletedAt: null,
            isArchived: false
        });
        console.log('Fixed deletedAt and isArchived.');
    } else {
        console.log('Document not found in standlo DB!');
    }
}
fix();
