const { credential } = require('firebase-admin');
const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

const app = initializeApp({
    projectId: "standlo",
    credential: credential.cert(path.resolve(process.cwd(), 'keys/standlo-firebase-adminsdk-fbsvc-5a2af63973.json'))
});

async function test() {
    try {
        const db1 = getFirestore(app);
        await db1.collection('test').limit(1).get();
        console.log("Success with (default)");
    } catch(e) {
        console.log("Failed with (default)", e.message);
    }
    
    try {
        const db2 = getFirestore(app, "default");
        await db2.collection('test').limit(1).get();
        console.log("Success with named 'default'");
    } catch(e) {
        console.log("Failed with named 'default'", e.message);
    }
}
test();
