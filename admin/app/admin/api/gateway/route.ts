import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
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
        // 0. Extract cookie for env checking
        const cookieHeader = req.headers.get("cookie") || "";
        const isEmulator = cookieHeader.includes("firebase_env=emulator");

        // 1. Verify Authentication from headers
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { status: "error", message: "Missing or invalid Authorization header" },
                { status: 401 }
            );
        }

        const idToken = authHeader.split("Bearer ")[1];
        try {
            await getAuth().verifyIdToken(idToken);
        } catch (authError: unknown) {
            // Emulators often use invalid signatures that trigger error code: auth/argument-error or similar. We can bypass this if explicitly running locally.
            const err = authError as { code?: string; message?: string };
            if (isEmulator && (err?.code === 'auth/invalid-id-token' || err?.message?.includes('invalid signature') || err?.message?.includes('auth/argument-error'))) {
                console.warn("[API Proxy] Bypassing token validation error for local emulator.");
            } else {
                console.error("[API Proxy] Auth verification failed:", authError);
                return NextResponse.json(
                    { status: "error", message: "Unauthorized token", details: err?.message || "Unknown error" },
                    { status: 401 }
                );
            }
        }

        // 2. Parse request body
        const body = await req.json();
        console.log("[DEBUG] API Proxy received body:", JSON.stringify(body, null, 2));

        // 3. Construct callable URL
        // If NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL is set (e.g. dev), use it. Else default to production URL.
        const url = new URL(req.url);
        const targetQuery = url.searchParams.get("target") || "firestoreGateway";

        let baseUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || "https://europe-west4-standlo.cloudfunctions.net";
        if (isEmulator) {
            baseUrl = "http://127.0.0.1:5001/standlo/europe-west4";
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

        console.log(`[API Proxy] Forwarding to: ${targetUrl}`);
        const response = await fetch(targetUrl, fetchOptions);

        console.log(`[API Proxy] Upstream returned status: ${response.status}`);

        // 5. Read response
        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
            if (!response.ok) {
                console.error(`[API Proxy] Upstream JSON Error:`, data);
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
