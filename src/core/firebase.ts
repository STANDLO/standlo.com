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

if (typeof window !== "undefined") {
    // Check for emulator cookie AND verify we are in the Admin app via ENV flag
    if (process.env.NEXT_PUBLIC_IS_ADMIN_APP === "true" && document.cookie.includes("firebase_env=emulator")) {
        console.warn("⚠️ Firebase Emulators: Connecting to local function emulator");
        connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    }
}

export { app, auth, appCheck, storage, functions, analytics };
