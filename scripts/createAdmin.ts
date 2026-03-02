import * as admin from "firebase-admin";

const serviceAccount = require("../keys/standlo-firebase-adminsdk-fbsvc-5a2af63973.json");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

async function createAdmin() {
    const email = "kalex@standlo.com";
    const password = "AdminStandlo2026!"; // Hardcoded for initial access

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

        await admin.auth().setCustomUserClaims(user.uid, {
            roleId: "admin",
            orgId: "system",
            onboarding: "completed"
        });

        console.log(`Successfully configured admin account: ${email}`);
        console.log(`Default Password: ${password}`);

    } catch (error) {
        console.error("Error creating admin account:", error);
    }
}

createAdmin();
