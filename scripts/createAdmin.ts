import * as admin from "firebase-admin";

const serviceAccount = require("../keys/standlo-firebase-adminsdk-fbsvc-5a2af63973.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function createAdmin() {
    const email = "kalex@standlo.com";
    const password = "LY2qDcYE0oz9kYm453GMUcs5QxXP8zWQ"; // Hardcoded for initial access

    try {
        let user;
        try {
            user = await admin.auth().getUserByEmail(email);
            console.log("User already exists, updating password and claims...");
            await admin.auth().updateUser(user.uid, { password });
        } catch (e: any) {
            if (e.code === 'auth/user-not-found') {
                user = await admin.auth().createUser({
                    email,
                    password,
                    emailVerified: true,
                    displayName: "Kalex Admin"
                });
                console.log("User created successfully!");
            } else {
                throw e;
            }
        }

        const claims = {
            role: "admin", // use role instead of roleId for the v2 schema
            orgId: "system",
            onboarding: true,
            active: true
        };

        await admin.auth().setCustomUserClaims(user.uid, claims);

        const db = admin.firestore();
        await db.collection('users').doc(user.uid).set({
            email: user.email,
            displayName: user.displayName || "Admin",
            active: true,
            claims: claims,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`Successfully configured admin account: ${email}`);
        console.log(`Default Password: ${password}`);
        console.log(`Firestore document users/${user.uid} generated.`);

    } catch (error) {
        console.error("Error creating admin account:", error);
    }
}

createAdmin();
