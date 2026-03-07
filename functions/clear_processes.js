const admin = require('firebase-admin');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:4000';
// Mock credential for emulator
admin.initializeApp({ projectId: 'standlo', credential: admin.credential.applicationDefault() });
async function run() {
    try {
        const db = admin.firestore();
        const snap = await db.collection('processes').get();
        const batch = db.batch();
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        console.log('Cleared ' + snap.docs.length + ' malformed processes.');
    } catch (e) {
        console.log('Ignore error: ' + e);
    }
}
run();
