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

        }
    } catch (e) {
        console.error("AppCheck initialization failed:", e);
    }

    // Initialize Analytics
    isSupported().then((supported) => {
        if (supported) {
            analytics = getAnalytics(app);

        }
    }).catch(console.error);
}

const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app, "europe-west4"); // Default region for KalexAI functions

import { connectAuthEmulator } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator } from "firebase/storage";

const db = getFirestore(app, "standlo");

if (typeof window !== "undefined") {
    // Check if we are running the local emulator (usually via project id or an explicit env var) for PUBLIC apps
    const useEmulatorEnv = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === "demo-standlo";

    // Check for emulator cookie robustly avoiding cross-path duplicate conflicts
    let isEmulatorCookie = false;
    if (typeof document !== "undefined") {
        const match = document.cookie.match(/(^|;\s*)firebase_env=([^;]+)/);
        if (match && match[2] === "emulator") isEmulatorCookie = true;
    }

    const isAdminApp = process.env.NEXT_PUBLIC_IS_ADMIN_APP === "true";

    // DECISION LOGIC: 
    // If it's the Admin app, the COOKIE is the absolute source of truth. Ignore env vars.
    // If it's a public app (no cookie logic), fallback to the ENV var.
    const shouldConnectEmulator = isAdminApp ? isEmulatorCookie : useEmulatorEnv;

    if (shouldConnectEmulator) {
        console.warn("⚠️ Firebase Emulators: Connecting to local emulators at " + window.location.hostname);
        const host = window.location.hostname;
        connectFunctionsEmulator(functions, host, 5001);
        connectAuthEmulator(auth, `http://${host}:9099`);
        // Connettiamo Firestore esplicitamente al database "standlo"
        connectFirestoreEmulator(db, host, 8080);
        connectStorageEmulator(storage, host, 9199);
    }
}

export { app, auth, appCheck, storage, functions, analytics, db };

