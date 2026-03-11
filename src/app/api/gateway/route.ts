import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getApps, initializeApp, cert } from "firebase-admin/app";

// Initialize admin app if not already initialized
if (!getApps().length) {
    let credential;
    try {
        const adminKeyStr = process.env.FIREBASE_ADMIN_KEY;
        if (adminKeyStr) {
            try {
                const adminKeyObj = JSON.parse(adminKeyStr);
                credential = cert(adminKeyObj);
            } catch (parseError) {
                console.warn("[API Proxy] FIREBASE_ADMIN_KEY is not a JSON object string. Trying direct path or default creds.", parseError);
            }
        }

        initializeApp(credential ? { credential } : undefined);
    } catch (error) {
        console.warn("[API Proxy] Admin SDK init warn (often acceptable in dev):", error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("Authorization");
        
        // Only verify logic if Authorization is passed
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const idToken = authHeader.split("Bearer ")[1];
            try {
                await getAuth().verifyIdToken(idToken);
            } catch (authError) {
                console.error("[API Proxy] Auth verification failed:", authError);
                return NextResponse.json(
                    { status: "error", message: "Unauthorized token", details: authError },
                    { status: 401 }
                );
            }
        }

        // 2. Parse request body
        const body = await req.json();

        // 3. Construct callable URL
        const url = new URL(req.url);
        const targetQuery = url.searchParams.get("target") || "orchestrator";
        const baseUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL || "https://europe-west4-standlo.cloudfunctions.net";
        const functionName = targetQuery;

        const targetUrl = `${baseUrl}/${functionName}`;
        const appCheckHeader = req.headers.get("X-Firebase-AppCheck") || req.headers.get("x-firebase-appcheck");

        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        };
        
        if (authHeader) {
            headers["Authorization"] = authHeader;
        }
        
        if (appCheckHeader) {
            headers["X-Firebase-AppCheck"] = appCheckHeader;
        }

        // Firebase Cloud Functions (onCall) expect a specific JSON payload format: { data: { ... } }
        const fetchOptions: RequestInit = {
            method: "POST",
            headers,
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
