import { NextRequest, NextResponse } from "next/server";
import { removeAuthCookies } from "next-firebase-auth-edge/lib/next/cookies";
import { authConfig } from "@/core/auth-edge";

export async function GET(request: NextRequest) {
    try {
        const response = await removeAuthCookies(request.headers, authConfig);
        return response;
    } catch (e: unknown) {
        console.error("Logout API Error", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
