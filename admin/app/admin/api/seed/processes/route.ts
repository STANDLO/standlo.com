import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
    try {
        // 1. Verify Authentication (requires Admin/God Mode normally, simplified check here)
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { status: "error", message: "Missing or invalid Authorization header" },
                { status: 401 }
            );
        }

        const idToken = authHeader.split("Bearer ")[1];
        try {
            // Token is verified against real Auth if not running with local FIREBASE_AUTH_EMULATOR_HOST in the shell.
            // Bypassing logic below handles emulator signature failures.

            await getAuth().verifyIdToken(idToken);
        } catch (authError: unknown) {
            // Check cookie again to see if we're pointing to emulator
            const cookieHeader = req.headers.get("cookie") || "";
            const isEmulator = cookieHeader.includes("firebase_env=emulator");
            const err = authError as { code?: string; message?: string };
            if (isEmulator && (err?.code === 'auth/invalid-id-token' || err?.message?.includes('invalid signature') || err?.message?.includes('auth/argument-error'))) {
                console.warn("[Seed Processes] Bypassing token validation error for local emulator.");
            } else {
                console.error("[Seed Processes] Auth verification failed:", authError);
                return NextResponse.json(
                    { status: "error", message: "Unauthorized token", details: err?.message || "Unknown error" },
                    { status: 401 }
                );
            }
        }

        // 2. Read the CSV File
        const csvPath = path.join(process.cwd(), "..", "seed", "process.csv");
        if (!fs.existsSync(csvPath)) {
            return NextResponse.json({ status: "error", message: "process.csv not found in seed folder" }, { status: 404 });
        }

        const csvContent = fs.readFileSync(csvPath, "utf-8");
        const lines = csvContent.split("\n").filter(line => line.trim().length > 0);

        // Skip header
        const dataLines = lines.slice(1);

        const processes = [];
        let currentPhase = "";

        for (const line of dataLines) {
            // Regex to split by comma, respecting double quotes
            const parts = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g)?.map(p => {
                let val = p.startsWith(',') ? p.substring(1) : p;
                if (val.startsWith('"') && val.endsWith('"')) {
                    val = val.substring(1, val.length - 1).replace(/""/g, '"');
                }
                return val.trim();
            });

            if (parts && parts.length >= 3 && parts[1]) {
                if (parts[0]) {
                    currentPhase = parts[0];
                }
                processes.push({
                    phase: currentPhase,
                    code: parts[1],
                    name: parts[2],
                    description: parts[3] || ""
                });
            }
        }

        console.log(`[Seed Processes] Found ${processes.length} processes to seed.`);

        // 3. Send to Gateway
        // We will call our own gateway locally to ensure it routes to the correct environment (Prod/Emulator)
        const baseUrl = req.nextUrl.origin;
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (const p of processes) {
            try {
                const gatewayUrl = `${baseUrl}/admin/api/gateway?target=orchestrator`;
                const payload = {
                    roleId: "admin",
                    entityId: "process",
                    actionId: "create_entity",
                    payload: {
                        type: "process",
                        code: p.code,
                        name: p.name,
                        phase: p.phase,
                        description: p.description,
                        status: "active",
                        requiredRole: "manager" // Default base role
                    }
                };

                const res = await fetch(gatewayUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": authHeader, // Pass auth
                        "cookie": req.headers.get("cookie") || "" // Pass env cookie
                    },
                    body: JSON.stringify(payload)
                });

                if (res.ok) {
                    const resData = await res.json();
                    if (resData.result && resData.result.data && resData.result.data.id) {
                        successCount++;
                    } else {
                        errorCount++;
                        errors.push(`Failed on ${p.code}: ${JSON.stringify(resData)}`);
                    }
                } else {
                    errorCount++;
                    errors.push(`HTTP ${res.status} on ${p.code}: ${await res.text()}`);
                }
            } catch (err) {
                errorCount++;
                errors.push(`Exception on ${p.code}: ${err}`);
            }
        }

        return NextResponse.json({
            status: "success",
            message: `Seeding complete. Success: ${successCount}, Errors: ${errorCount}`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: unknown) {
        console.error("[Seed Processes] Fatal error:", error);
        return NextResponse.json(
            { status: "error", message: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
