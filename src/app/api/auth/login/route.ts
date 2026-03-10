import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "next-firebase-auth-edge/lib/next/cookies";
import { authConfig } from "@/core/auth-edge";

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Missing token" }, { status: 401 });
        }

        // AppCheck Token forwarding to Identity Platform
        const appCheckToken = request.headers.get("X-Firebase-AppCheck");
        const headers = new Headers();
        if (appCheckToken) {
            headers.set("X-Firebase-AppCheck", appCheckToken);
        }

        const response = await setAuthCookies(request.headers, {
            ...authConfig,
            // @ts-expect-error Iniezione non tipizzata ufficialmente ma supportata dal modulo fetch back
            headers
        });
        return response;
    } catch (e: unknown) {
        console.error("Login API Error", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
