const admin = require('firebase-admin');
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.GCLOUD_PROJECT = 'standlo';

admin.initializeApp({ projectId: 'standlo' });

async function run() {
    try {
        const email = 'cristian@standlo.com';
        const userRecord = await admin.auth().getUserByEmail(email);
        const uid = userRecord.uid;
        console.log(`User: ${uid}`);
        
        await admin.auth().setCustomUserClaims(uid, {
            ...userRecord.customClaims,
            role: "standlo_design",
            onboarding: true,
            orgId: uid,
            active: true
        });
        console.log('Claims Set');

        const db = admin.firestore();
        // Le Cloud Functions usano la named database "standlo", vediamo se possiamo accedervi
        const standloDb = new admin.firestore.Firestore({
            projectId: 'standlo',
            databaseId: 'standlo'
        });

        await standloDb.collection('organizations').doc(uid).set({
            active: true,
            roleId: "standlo_design"
        }, { merge: true });
        
        console.log('Done!');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
run();
