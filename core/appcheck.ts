import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from 'firebase/app-check';
import { getApp } from 'firebase/app';

let appCheckInstance: AppCheck | null = null;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "YOUR_RECAPTCHA_KEY_HERE";

/**
 * Global AppCheck Provider (V2 Architecture)
 * - Returns the singleton AppCheck instance for Client-Side protection.
 * - Must be called BEFORE dialing out to Firestore or Functions.
 */
export const getAppCheck = (): AppCheck | null => {
    if (typeof window === "undefined") return null;

    if (!appCheckInstance) {
        try {
            appCheckInstance = initializeAppCheck(getApp(), {
                provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_SITE_KEY),
                isTokenAutoRefreshEnabled: true
            });
            console.info("[AppCheck] ReCaptcha Enterprise protection initialized.");
        } catch (error) {
            console.error("[AppCheck] Failed to initialize AppCheck:", error);
        }
    }

    return appCheckInstance;
};
