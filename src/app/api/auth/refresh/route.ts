import { NextRequest, NextResponse } from "next/server";
import { getTokens } from "next-firebase-auth-edge";
import { authConfig } from "@/core/auth-edge";
import { cookies } from "next/headers";
import "@/core/db"; // Assicura che l'app firebase-admin [DEFAULT] sia inizializzata con le credenziali del Service Account
import { getAuth } from "firebase-admin/auth";
import { refreshNextResponseCookiesWithToken } from "next-firebase-auth-edge/lib/next/cookies";

export async function POST(request: NextRequest) {
    try {
        console.log("👉 [DEBUG API] Avvio sync forzato delle claims...");
        const cookieStore = await cookies();
        const tokens = await getTokens(cookieStore, authConfig);

        if (!tokens) {
            console.error("❌ Nessun token di sessione trovato.");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const uid = tokens.decodedToken.uid;

        // 1. Diciamo all'Admin SDK di Firebase di creare un Custom Token per questo utente.
        const customToken = await getAuth().createCustomToken(uid);

        // 1.5 Mungiamo un token AppCheck backend-to-backend per Firebase Identity Platform
        let appCheckToken = "";
        try {
            const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
            if (appId) {
                const { getAppCheck } = await import("firebase-admin/app-check");
                const tokenResponse = await getAppCheck().createToken(appId);
                appCheckToken = tokenResponse.token;
            }
        } catch (error) {
            console.warn("⚠️ [DEBUG API] Impossibile generare AppCheck Token lato server:", error);
        }

        // 2. Chiediamo a Firebase Identity Platform di scambiare questo Custom Token
        const identityEndpoint = process.env.FIREBASE_AUTH_EMULATOR_HOST
            ? `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${authConfig.apiKey}`
            : `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${authConfig.apiKey}`;

        const res = await fetch(identityEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(appCheckToken ? { 'X-Firebase-AppCheck': appCheckToken } : {})
            },
            body: JSON.stringify({ token: customToken, returnSecureToken: true }),
        });

        const data = await res.json();
        if (!res.ok) {
            console.error("❌ [DEBUG API] Errore Identity Platform:", data);
            throw new Error(data.error?.message || "Errore nello scambio token");
        }

        const newIdToken = data.idToken;

        const newRequest = new NextRequest(request.url, {
            headers: new Headers(request.headers)
        });

        // 3. Forziamo next-firebase-auth-edge ad aggiornare i cookies della risposta (sia session che refresh)
        // usando refreshNextResponseCookiesWithToken e passando i token freschi appena generati.
        const mergedResponse = await refreshNextResponseCookiesWithToken(newIdToken, newRequest, NextResponse.json({ success: true }), authConfig);

        console.log("👉 [DEBUG API] Claims rinfrescate e Cookie aggiornati con successo per", uid);
        return mergedResponse as NextResponse;

    } catch (e: unknown) {
        console.error("Refresh API Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
