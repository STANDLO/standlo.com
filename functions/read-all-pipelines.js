const admin = require('firebase-admin');

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

admin.initializeApp({ projectId: "standlo" });
const db = admin.firestore();

async function main() {
    try {
        const snap = await db.collection('pipelines').get();
        if (snap.empty) {
            console.log("No pipelines found.");
        }
        snap.forEach(doc => {
            const data = doc.data();
            console.log("PIPELINE ID:", doc.id);
            if (data.nodes) {
                data.nodes.forEach(n => {
                    if (n.type === "action" && n.data.actionType === "orchestrator_create") {
                        console.log("Found orchestrator_create:", n.data.targetPath);
                    }
                    if (n.type === "action" && (n.data.actionType === "onboard_organization" || n.data.actionType === "orchestrator_onboardOrganization")) {
                        console.log("Found onboard", n.data);
                    }
                    // Print any action that mentions organization
                    if (JSON.stringify(n).includes("onboard")) {
                        console.log("Node with onboard:", JSON.stringify(n));
                    }
                });
            }
        });
    } catch (e) {
        console.error("ERROR", e);
    }
}
main();
