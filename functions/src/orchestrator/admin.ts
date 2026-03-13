import * as admin from "firebase-admin";
import { HttpsError } from "firebase-functions/v2/https";

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

        // 2. Grant "active: true" to Custom Claims in Firebase Auth
        const targetRecord = await admin.auth().getUser(targetUserId);
        const newClaims = {
            ...targetRecord.customClaims,
            phoneNumber: targetRecord.phoneNumber || null,
            active: true
        };
        await admin.auth().setCustomUserClaims(targetUserId, newClaims);

        // 3. Update the users and organization collections via firestore.run batch
        const { firestore } = await import("../gateways/firestore");
        const { createInternalRequest } = await import("../gateways/internal");

        // Wait, to know the orgId, we need to read the user first.
        const readUserReq = createInternalRequest({
            actionId: "read",
            entityId: "user",
            payload: { id: targetUserId }
        }, callerUid, "standlo");
        
        const readUserRes = await firestore.run(readUserReq);
        const userData = readUserRes.data as Record<string, unknown> | undefined;

        const operations: Record<string, unknown>[] = [
            {
                type: "update",
                entityId: "user",
                id: targetUserId,
                data: {
                    id: targetUserId,
                    active: true,
                    "claims.active": true
                }
            }
        ];

        if (userData?.orgId) {
            operations.push({
                type: "update",
                entityId: "organization",
                id: userData.orgId,
                data: {
                    id: userData.orgId,
                    active: true
                }
            });
        }

        const batchReq = createInternalRequest({
            actionId: "batch",
            entityId: "user",
            payload: { operations }
        }, callerUid, (userData?.orgId as string) || "standlo");

        await firestore.run(batchReq);

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

        const { firestore } = await import("../gateways/firestore");
        const { createInternalRequest } = await import("../gateways/internal");

        // 1. Pending Users
        // We need to list users where active === false
        const pendingUsersReq = createInternalRequest({
            actionId: "list",
            entityId: "user",
            filters: [{ field: "active", op: "==", value: false }],
            limit: 500 // Assuming not more than 500 pending users
        }, callerUid, "standlo");

        const pendingUsersRes = await firestore.run(pendingUsersReq);
        const pendingUsers = (pendingUsersRes.data as unknown[])?.length || 0;
        
        // Let's get total users count by reading users with no filters
        // Wait, for KPIs, we might just use the pending users count, as total users via list might be inefficient if > 500.
        // We'll list up to 500 for total.
        const totalUsersReq = createInternalRequest({
            actionId: "list",
            entityId: "user",
            limit: 500
        }, callerUid, "standlo");
        const totalUsersRes = await firestore.run(totalUsersReq);
        const totalUsers = (totalUsersRes.data as unknown[])?.length || 0;

        // 2. Recent Alerts (unresolved or total)
        const recentAlertsReq = createInternalRequest({
            actionId: "list",
            entityId: "alert",
            limit: 100
        }, callerUid, "standlo");
        const recentAlertsRes = await firestore.run(recentAlertsReq);
        const recentAlerts = (recentAlertsRes.data as unknown[])?.length || 0;

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
