import { NextResponse } from "next/server";
// import admin from "firebase-admin";

export async function GET() {
    try {
        // Initialize Firebase Admin SDK lazily if not already initialized
        // const db = admin.firestore();
        // const snapshot = await db.collection("alerts").orderBy("createdAt", "desc").limit(100).get();
        // const alerts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

        // Mocking for the baseline as Firebase Admin isn't initialized locally yet.
        const mockAlerts = [
            {
                createdAt: new Date().toISOString(),
                type: "security",
                uid: "user_123",
                email: "hacker@test.com",
                roleId: "customer",
                action: "update",
                entityId: "organizations/org_abc",
                errorMessage: "Attempted to modify roleId field which is restricted for customer."
            }
        ];

        return NextResponse.json({ success: true, alerts: mockAlerts });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
    }
}
