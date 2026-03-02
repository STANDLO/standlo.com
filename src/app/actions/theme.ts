"use server";

import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/core/auth-edge";
import { db } from "@/core/db";

export async function updateUserTheme(theme: string) {
    const tokens = await getTokens(await cookies(), authConfig);
    if (!tokens) {
        return { success: false, error: "Unauthorized" };
    }

    const uid = tokens.decodedToken.uid;

    try {
        const userRef = db.collection("users").doc(uid);
        await userRef.set({
            claims: { theme }
        }, { merge: true });

        console.log(`Saved new theme preference '${theme}' for user ${uid}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update user theme:", error);
        return { success: false, error: "Failed to update theme" };
    }
}
