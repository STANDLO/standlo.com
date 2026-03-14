import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert, getApp } from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
import fs from "fs";

// Initialize admin app if not already initialized
if (!getApps().length) {
    let credential;
    try {
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (clientEmail && privateKey && projectId) {
            try {
                const adminKeyObj = {
                    project_id: projectId,
                    client_email: clientEmail,
                    private_key: privateKey,
                };
                credential = cert({
                    projectId,
                    clientEmail,
                    privateKey,
                });

                // Workaround for google-auth-library (used by app-check) requiring a file for default credentials
                if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
                    const tempPath = "/tmp/firebase-admin-key.json";
                    fs.writeFileSync(tempPath, JSON.stringify(adminKeyObj));
                    process.env.GOOGLE_APPLICATION_CREDENTIALS = tempPath;
                }
            } catch (parseError) {
                console.warn("[API Proxy] Error parsing admin credentials.", parseError);
            }
        }

        initializeApp(credential ? { credential } : undefined);
    } catch (error) {
        console.warn("[API Proxy] Admin SDK init warn (often acceptable in dev):", error);
    }
}

export async function POST(req: NextRequest) {
    try {
        // 0. Extract cookie for env checking robustly using Next.js cookie parser
        // This avoids bugs caused by `.includes()` if multiple cookie paths exist
        const isEmulatorCookie = req.cookies.get("firebase_env")?.value === "emulator";
        const isEmulator = isEmulatorCookie || process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

        // 1. Verify Authentication Headers existence
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { status: "error", message: "Missing or invalid Authorization header" },
                { status: 401 }
            );
        }

        const idToken = authHeader.split("Bearer ")[1];

        // We DO NOT run `getAuth().verifyIdToken(idToken)` here on the Proxy!
        // Admin UI often runs locally without `FIREBASE_ADMIN_PRIVATE_KEY` and fails to verify Production tokens.
        // It's safe to skip it here because the target upstream Cloud Functions (Orchestrator, etc.) 
        // will perform absolute hardware-grade verification anyway.

        // Decode token just for debugging if needed
        try {
            const parts = idToken.split('.');
            if (parts.length === 3) {
                const header = JSON.parse(Buffer.from(parts[0], 'base64').toString('ascii'));
                const payloadStr = JSON.parse(Buffer.from(parts[1], 'base64').toString('ascii'));
                console.log("[API Proxy DEBUG] Decoding JWT - alg:", header.alg, "aud:", payloadStr.aud);
            }
        } catch { /* ignore */ }

        // 2. Parse request body
        const body = await req.json();
        console.log("[DEBUG] API Proxy received body:", JSON.stringify(body, null, 2));

        // 3. Construct callable URL
        // If NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL is set (e.g. dev), use it. Else default to production URL.
        const url = new URL(req.url);
        const targetQuery = url.searchParams.get("target") || "firestoreGateway";

        let baseUrl = "https://europe-west4-standlo.cloudfunctions.net";

        if (isEmulator) {
            baseUrl = "http://127.0.0.1:5001/standlo/europe-west4";
        } else if (process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL) {
            const envUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL;
            if (!envUrl.includes("127.0.0.1") && !envUrl.includes("localhost")) {
                baseUrl = envUrl;
            }
        }

        const functionName = targetQuery;

        const targetUrl = `${baseUrl}/${functionName}`;

        // 4. Generate AppCheck token
        let appCheckToken = "";
        try {
            const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
            if (appId) {
                const tokenResponse = await getAppCheck(getApp()).createToken(appId);
                appCheckToken = tokenResponse.token;
            }
        } catch (adminAppCheckError) {
            console.warn("[API Proxy] Could not generate server-side AppCheck token:", adminAppCheckError);
        }

        // Firebase Cloud Functions (onCall) expect a specific JSON payload format: { data: { ... } }
        const fetchOptions: RequestInit = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Pass the bearer token forward exactly as the client sent it
                "Authorization": authHeader,
                ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {})
            },
            body: JSON.stringify({ data: body })
        };

        console.log(`[API Proxy] 🌐 FORWARDING TO: ${targetUrl}`);
        const response = await fetch(targetUrl, fetchOptions);

        console.log(`[API Proxy] ☁️ UPSTREAM RETURNED STATUS: ${response.status}`);

        // 5. Read response
        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
            console.log(`[API Proxy] 📦 UPSTREAM RESPONSE DATA:`, JSON.stringify(data).substring(0, 500) + (JSON.stringify(data).length > 500 ? "..." : ""));

            if (!response.ok) {
                console.error(`[API Proxy] ❌ Upstream JSON Error:`, data);
            }
        } else {
            const textData = await response.text();
            console.error(`[API Proxy] Upstream returned non-JSON: ${response.status} ${textData.substring(0, 100)}`);
            return NextResponse.json(
                { status: "error", message: "Upstream returned invalid generic format", details: textData.substring(0, 100) },
                { status: 502 }
            );
        }

        // Return exactly what the callable returned
        // Callables wrap response in { result: { ... } } or { error: { ... } }
        return NextResponse.json(data, { status: response.status });

    } catch (error: unknown) {
        console.error("[API Proxy] Internal proxy error:", error);
        return NextResponse.json(
            { status: "error", message: "Internal Server Proxy Error", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
