import admin from 'firebase-admin';

// Assicuriamoci di agganciarci all'emulatore locale
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.GCLOUD_PROJECT = 'standlo';

// Inizializza l'SDK lato server per l'emulatore
if (!admin.apps.length) {
    admin.initializeApp({ projectId: 'standlo' });
}

async function seedLocalAdmin() {
    const email = 'kalex@standlo.com';
    const password = 'LY2qDcYE0oz9kYm453GMUcs5QxXP8zWQ';

    try {
        let user;
        try {
            // Se esiste, aggiorna solo la password
            user = await admin.auth().getUserByEmail(email);
            await admin.auth().updateUser(user.uid, { password });
        } catch (e) {
            if (e.code === 'auth/user-not-found') {
                // Se non esiste, crealo
                user = await admin.auth().createUser({
                    email,
                    password,
                    emailVerified: true,
                    displayName: "Kalex Admin"
                });
            } else {
                throw e;
            }
        }

        // Iniettiamo i custom claims amministrativi
        await admin.auth().setCustomUserClaims(user.uid, {
            roleId: "admin",
            orgId: "system",
            onboarding: "completed",
            active: true // Essendo admin, è implicitamente attivo
        });

        console.log(`✅ Admin locale configurato (${email}) con la password aggiornata.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Errore durante la creazione dell\'admin locale:', error);
        process.exit(1);
    }
}

seedLocalAdmin();
