import admin from 'firebase-admin';

export async function seedLocalAdmin() {
    const email = "kalex@standlo.com";
    const password = "AdminStandlo2026!"; // Hardcoded for initial access

    try {
        let user;
        try {
            user = await admin.auth().getUserByEmail(email);
            console.log("[Seed] Local Admin User already exists.");
        } catch (e) {
            if (e.code === 'auth/user-not-found') {
                user = await admin.auth().createUser({
                    email,
                    password,
                    emailVerified: true,
                    displayName: "Kalex Admin"
                });
                console.log("[Seed] Local Admin User created successfully!");
            } else {
                throw e;
            }
        }

        await admin.auth().setCustomUserClaims(user.uid, {
            roleId: "admin",
            orgId: "system",
            onboarding: "completed"
        });

        console.log(`[Seed] Successfully configured admin account: ${email}`);
    } catch (error) {
        console.error("[Seed] Error creating admin account:", error);
        throw error;
    }
}
