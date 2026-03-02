"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activateUser = activateUser;
exports.getAdminKpis = getAdminKpis;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
/**
 * Activates a pending user.
 * Must be called by an authenticated user with `roleId === "admin"`.
 */
async function activateUser(callerUid, payload) {
    var _a;
    const targetUserId = payload.userId;
    if (!targetUserId) {
        throw new https_1.HttpsError("invalid-argument", "Missing userId in payload.");
    }
    try {
        // 1. Verify caller has the "admin" role
        const callerRecord = await admin.auth().getUser(callerUid);
        if (((_a = callerRecord.customClaims) === null || _a === void 0 ? void 0 : _a.roleId) !== "admin") {
            console.warn(`[Security] Unauthorized user ${callerUid} attempted to activate ${targetUserId}`);
            throw new https_1.HttpsError("permission-denied", "Only administrators can activate users.");
        }
        const db = (0, firestore_1.getFirestore)(admin.app(), "standlo");
        // 2. Grant "active: true" to Custom Claims in Firebase Auth
        const targetRecord = await admin.auth().getUser(targetUserId);
        const newClaims = Object.assign(Object.assign({}, targetRecord.customClaims), { active: true });
        await admin.auth().setCustomUserClaims(targetUserId, newClaims);
        // 3. Update the users collection
        const userRef = db.collection("users").doc(targetUserId);
        await userRef.update({
            active: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: callerUid
        });
        // 4. Update the organization collection (if necessary, though active is also tied to user)
        // Usually, the organization has active: true. Let's find the org associated with this user.
        const targetUserSnap = await userRef.get();
        if (targetUserSnap.exists) {
            const userData = targetUserSnap.data();
            if (userData === null || userData === void 0 ? void 0 : userData.orgId) {
                const orgRef = db.collection("organizations").doc(userData.orgId);
                await orgRef.update({
                    active: true,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedBy: callerUid
                });
            }
        }
        console.log(`[Admin Orchestrator] User ${targetUserId} successfully activated by admin ${callerUid}.`);
        return {
            status: "success",
            message: `User ${targetUserId} successfully activated.`
        };
    }
    catch (error) {
        console.error(`[Admin Orchestrator] Failed to activate user ${targetUserId}:`, error);
        throw new https_1.HttpsError("internal", "Failed to activate user.", error);
    }
}
/**
 * Retrieves platform KPIs for the Admin Dashboard.
 * Must be called by an authenticated user with `roleId === "admin"`.
 */
async function getAdminKpis(callerUid) {
    var _a;
    try {
        const callerRecord = await admin.auth().getUser(callerUid);
        if (((_a = callerRecord.customClaims) === null || _a === void 0 ? void 0 : _a.roleId) !== "admin") {
            throw new https_1.HttpsError("permission-denied", "Only administrators can view KPIs.");
        }
        const db = (0, firestore_1.getFirestore)(admin.app(), "standlo");
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
    }
    catch (error) {
        console.error(`[Admin Orchestrator] Failed to fetch KPIs:`, error);
        throw new https_1.HttpsError("internal", "Failed to fetch KPIs.");
    }
}
//# sourceMappingURL=admin.js.map