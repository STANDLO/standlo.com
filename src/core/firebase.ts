import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from "firebase/app-check";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAnalytics, isSupported, Analytics } from "firebase/analytics";

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
let analytics: Analytics | undefined;

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

    // Initialize Analytics
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);
            console.log("Firebase Analytics initialized successfully.");
        }
    }).catch(console.error);
}

const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app, "europe-west4"); // Default region for KalexAI functions

import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";

if (typeof window !== "undefined") {
    // Check if we are running the local emulator (usually via project id or an explicit env var)
    const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === "demo-standlo";

    // Check for emulator cookie AND verify we are in the Admin app via ENV flag (Legacy behavior)
    const legacyAdminEmulator = process.env.NEXT_PUBLIC_IS_ADMIN_APP === "true" && document.cookie.includes("firebase_env=emulator");

    if (useEmulator || legacyAdminEmulator) {
        console.warn("⚠️ Firebase Emulators: Connecting to local emulators");
        connectFunctionsEmulator(functions, "127.0.0.1", 5001);
        connectAuthEmulator(auth, "http://127.0.0.1:9099");
        // Connettiamo Firestore esplicitamente al database "standlo"
        connectFirestoreEmulator(getFirestore(app, "standlo"), "127.0.0.1", 8080);
        connectStorageEmulator(storage, "127.0.0.1", 9199);
    }
}

export { app, auth, appCheck, storage, functions, analytics };
