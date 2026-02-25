"use server";

import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/core/auth-edge";
import { db } from "@/core/db";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

export async function generateApiKey() {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) {
        return { success: false, error: "Unauthorized" };
    }

    const uid = tokens.decodedToken.uid;
    const userRecord = await admin.auth().getUser(uid);
    const customClaims = (userRecord.customClaims || {}) as Record<string, unknown>;
    const orgId = customClaims.orgId as string;

    if (!orgId) {
        return { success: false, error: "Organization not found" };
    }

    // 1. Generate secure key
    const rawUuid = crypto.randomUUID().replace(/-/g, "");
    const clearKey = `sk_live_${rawUuid}`;

    // 2. Hash it via SHA-256 for secure DB storage
    const hashedKey = crypto.createHash("sha256").update(clearKey).digest("hex");
    const hint = "..." + clearKey.slice(-4);

    // 3. Delete old keys for this org (Simple rotation: 1 active key per org)
    const oldKeysSnapshot = await db.collection("apikeys").where("orgId", "==", orgId).get();
    const batch = db.batch();
    oldKeysSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    // 4. Save new hashed key
    const newKeyRef = db.collection("apikeys").doc();
    batch.set(newKeyRef, {
        hashedKey,
        hint,
        orgId,
        code: `APIKEY-${orgId}`,
        active: true,
        version: 1,
        createdAt: Date.now(),
        createdBy: uid,
        ownId: uid,
    });

    await batch.commit();

    // 5. Return the clear key ONLY ONCE to the client.
    return { success: true, clearKey, hint };
}

export async function getApiKeyHint() {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) return { success: false, error: "Unauthorized" };

    const uid = tokens.decodedToken.uid;
    const userRecord = await admin.auth().getUser(uid);
    const customClaims = (userRecord.customClaims || {}) as Record<string, unknown>;
    const orgId = customClaims.orgId as string;

    if (!orgId) return { success: false, error: "Organization not found" };

    const keysSnapshot = await db.collection("apikeys").where("orgId", "==", orgId).limit(1).get();
    if (keysSnapshot.empty) {
        return { success: true, hint: null, createdAt: null };
    }

    const keyData = keysSnapshot.docs[0].data();
    return { success: true, hint: keyData.hint as string, createdAt: keyData.createdAt as number };
}
