import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from "firebase/app-check";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

let appCheck: AppCheck | undefined;

if (typeof window !== "undefined") {
    // Enable debug mode if local debug token is injected via ENV
    if (process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN) {
        // @ts-expect-error: FIREBASE_APPCHECK_DEBUG_TOKEN is injected via window on client side
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = process.env.NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN;
    }

    try {
        const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
        if (!siteKey) {
            console.warn("⚠️ Firebase AppCheck: 'NEXT_PUBLIC_RECAPTCHA_SITE_KEY' è mancante nel file .env.local. AppCheck è disattivato e questo potrebbe causare errori 403 se è enforceato a livello cloud.");
        } else {
            appCheck = initializeAppCheck(app, {
                provider: new ReCaptchaEnterpriseProvider(siteKey),
                isTokenAutoRefreshEnabled: true
            });
            console.log("Firebase AppCheck initialized successfully on the client.");
        }
    } catch (e) {
        console.error("AppCheck initialization failed:", e);
    }
}

const auth = getAuth(app);

export { app, auth, appCheck };
