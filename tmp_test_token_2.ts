import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

async function run() {
    try {
        console.log("👉 Using ENV credential...");
        initializeApp({
            credential: cert({
                projectId: "standlo",
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/^"|"$/g, '').replace(/\\n/g, '\n'),
            }),
            projectId: 'standlo'
        });

        const uid = "test-uid-123";
        const customToken = await getAuth().createCustomToken(uid);
        console.log("👉 Custom Token minted:", customToken.substring(0, 30) + '...');

        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        console.log("👉 Exchanging with API Key:", apiKey);

        const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
        let appCheckToken = "";
        if (appId) {
            const { getAppCheck } = require('firebase-admin/app-check');
            const tokenResponse = await getAppCheck().createToken(appId);
            appCheckToken = tokenResponse.token;
        }

        const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(appCheckToken ? { 'X-Firebase-AppCheck': appCheckToken } : {})
            },
            body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        });

        const data = await res.json();
        if (!res.ok) {
            console.error("❌ Errore Identity Platform:", data);
        } else {
            console.log("✅ Token scambiato con successo! idToken:", data.idToken.substring(0, 20) + '...');
        }
    } catch (e) {
        console.error("❌ Eccezione:", e);
    }
}

run();
