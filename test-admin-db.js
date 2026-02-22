const admin = require('firebase-admin');
const path = require('path');
const app = admin.initializeApp({
    projectId: "standlo",
    credential: admin.credential.cert(path.resolve(process.cwd(), 'keys/standlo-firebase-adminsdk-fbsvc-5a2af63973.json'))
});
try {
    const db = admin.firestore(app, "default");
    console.log("admin.firestore works with databaseId");
} catch(e) {
    console.log("Error:", e.message);
}
