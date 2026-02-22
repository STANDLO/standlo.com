import { NextRequest, NextResponse } from "next/server";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/core/auth-edge";
import { db } from "@/core/db";
import * as admin from "firebase-admin";
import { OrganizationSchema } from "@/core/schemas";

export async function POST(request: NextRequest) {
    try {
        // 1. Validate JWT using edge tokens
        const tokens = await getTokens(await cookies(), authConfig);

        if (!tokens) {
            return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
        }

        const decodedToken = tokens.decodedToken;
        const uid = decodedToken.uid;
        const email = decodedToken.email;
        const customClaims = (decodedToken as Record<string, unknown>) as Record<string, unknown>;

        // Ensure user is truly in pending state to prevent overwriting mature profiles
        if (customClaims?.role !== "pending" && customClaims?.orgId) {
            return NextResponse.json({ message: "Account already initialized." }, { status: 400 });
        }

        // 2. Parse Incoming Onboarding Data
        const payload = await request.json();

        // Construct the Organization Data applying our unified Schema logic
        const orgData = {
            name: { it: payload.name || payload.fullAddress || "New Organization" }, // Fallback gracefully if name is missing from social login
            type: payload.role,
            vatNumber: payload.vatNumber,
            sdiCode: payload.sdiCode,
            iban: payload.iban,
            fullAddress: payload.fullAddress,
            address: payload.address,
            city: payload.city,
            province: payload.province,
            zipCode: payload.zipCode,
            country: payload.country,
        };

        // Partial validation (to skip createdAt/createdBy strictness handled server side)
        const parsedData = OrganizationSchema.partial().parse(orgData);

        // 3. Define the actual active status
        const role = parsedData.type as string;
        const isActive = role === "customer";

        // 4. Initialize Firestore Batch Transaction
        const batch = db.batch();
        const orgRootId = uid; // We use the User UID as the primary Org ID for simplicity in 1:1 mapping

        // Organization Document
        const orgRef = db.collection("organizations").doc(orgRootId);
        batch.set(orgRef, {
            ...parsedData as Record<string, unknown>,
            active: isActive,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: uid,
        }, { merge: true });

        // Update User Document to reflect the active status
        const userRef = db.collection("users").doc(uid);
        batch.set(userRef, {
            active: isActive,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        await batch.commit();

        // 5. Upgrade Custom Claims via Admin SDK
        const newClaims = {
            ...customClaims,
            role: role,
            onboarding: true,
            orgId: orgRootId,
            orgName: parsedData.name?.it || null,
            [`${role}Id`]: orgRootId,
            [`${role}Name`]: parsedData.name?.it || null,
        };

        await admin.auth().setCustomUserClaims(uid, newClaims);

        // Riscriviamo i nuovi claims pure nello UserDoc (denormalizzazione x middleware e admin rules)
        await userRef.update({ claims: newClaims });

        console.log(`[ONBOARDING] Successfully upgraded ${email} to role ${role}. Active: ${isActive}`);

        return NextResponse.json({ success: true, message: "Onboarding completato con successo" });

    } catch (error: unknown) {
        console.error("[ONBOARDING ERROR]", error);
        if (error instanceof Error) {
            return NextResponse.json(
                { message: error.message || "Errore interno durante il completamento del profilo." },
                { status: 500 }
            );
        }
        return NextResponse.json({ message: "Errore sconosciuto." }, { status: 500 });
    }
}
