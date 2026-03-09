import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * Activates a pending user.
 * Must be called by an authenticated user with `roleId === "admin"`.
 */
export async function activateUser(callerUid: string, payload: Record<string, unknown>) {
    const targetUserId = payload.userId as string;

    if (!targetUserId) {
        throw new HttpsError("invalid-argument", "Missing userId in payload.");
    }

    try {
        // 1. Verify caller has the "admin" role
        const callerRecord = await admin.auth().getUser(callerUid);
        if (callerRecord.customClaims?.role !== "admin" && callerRecord.customClaims?.roleId !== "admin") {
            console.warn(`[Security] Unauthorized user ${callerUid} attempted to activate ${targetUserId}`);
            throw new HttpsError("permission-denied", "Only administrators can activate users.");
        }

        const db = getFirestore(admin.app(), "standlo");

        // 2. Grant "active: true" to Custom Claims in Firebase Auth
        const targetRecord = await admin.auth().getUser(targetUserId);
        const newClaims = {
            ...targetRecord.customClaims,
            active: true
        };
        await admin.auth().setCustomUserClaims(targetUserId, newClaims);

        // 3. Update the users collection
        const userRef = db.collection("users").doc(targetUserId);
        await userRef.update({
            active: true,
            "claims.active": true,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: callerUid
        });

        // 4. Update the organization collection (if necessary, though active is also tied to user)
        // Usually, the organization has active: true. Let's find the org associated with this user.
        const targetUserSnap = await userRef.get();
        if (targetUserSnap.exists) {
            const userData = targetUserSnap.data();
            if (userData?.orgId) {
                const orgRef = db.collection("organizations").doc(userData.orgId);
                await orgRef.update({
                    active: true,
                    updatedAt: FieldValue.serverTimestamp(),
                    updatedBy: callerUid
                });
            }
        }

        console.log(`[Admin Orchestrator] User ${targetUserId} successfully activated by admin ${callerUid}.`);
        return {
            status: "success",
            message: `User ${targetUserId} successfully activated.`
        };

    } catch (error) {
        console.error(`[Admin Orchestrator] Failed to activate user ${targetUserId}:`, error);
        throw new HttpsError("internal", "Failed to activate user.", error);
    }
}

/**
 * Retrieves platform KPIs for the Admin Dashboard.
 * Must be called by an authenticated user with `roleId === "admin"`.
 */
export async function getAdminKpis(callerUid: string) {
    try {
        const callerRecord = await admin.auth().getUser(callerUid);
        if (callerRecord.customClaims?.role !== "admin" && callerRecord.customClaims?.roleId !== "admin") {
            throw new HttpsError("permission-denied", "Only administrators can view KPIs.");
        }

        const db = getFirestore(admin.app(), "standlo");

        // 1. Pending Users
        const usersSnapshot = await db.collection("users").get();
        let pendingUsers = 0;
        let totalUsers = 0;

        usersSnapshot.forEach(doc => {
            totalUsers++;
            if (doc.data().active === false) {
                pendingUsers++;
            }
        });

        // 2. Recent Alerts (unresolved or total)
        const alertsSnapshot = await db.collection("admin/security/alerts").limit(100).get();
        const recentAlerts = alertsSnapshot.size;

        return {
            status: "success",
            data: {
                totalUsers,
                pendingUsers,
                recentAlerts
            }
        };

    } catch (error) {
        console.error(`[Admin Orchestrator] Failed to fetch KPIs:`, error);
        throw new HttpsError("internal", "Failed to fetch KPIs.");
    }
}
