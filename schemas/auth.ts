import { z } from "zod";
import { DbSchema } from "./db";
import rolesJson from "./roles.json";

// Estrai dinamicamente gli ID dei ruoli dal file JSON come union di stringhe per Zod
const roleIds = rolesJson.map(role => role.id) as [string, ...string[]];

export const SystemRoles = roleIds;
export const RoleIdSchema = z.enum(roleIds);
export type RoleId = z.infer<typeof RoleIdSchema>;
/*
* ----------------------------------------------------
* Generic Auth Schema (Frontend Compatibility)
* ----------------------------------------------------
*/
export const AuthSchema = z.object({
  name: z.string().optional().describe("Primary identifier or name for the auth entity"),
});

export type AuthData = z.infer<typeof AuthSchema>;

export const AuthDbSchema = DbSchema.merge(AuthSchema);
export type AuthDbEntity = z.infer<typeof AuthDbSchema>;

/*
* Role Schema
*/
export const RoleSchema = DbSchema.extend({});
export type Role = z.infer<typeof RoleSchema>;

/*
* ----------------------------------------------------
* V2 DCODE Auth Schemas
* ----------------------------------------------------
*/

/**
 * [module: auth, action: read] - LOGIN FORM
 * Form object rendered by <CardForm> for user login.
 */
export const AuthReadSchema = z.object({
    email: z.string().email("Un'email valida è richiesta"),
    password: z.string().min(6, "La password deve contenere almeno 6 caratteri"),
});
export type AuthRead = z.infer<typeof AuthReadSchema>;

/**
 * DB Entity for the active Auth Session read record.
 */
export const AuthReadDbSchema = DbSchema.extend({
    email: z.string().email(),
    lastLoginAt: z.date(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
});
export type AuthReadDb = z.infer<typeof AuthReadDbSchema>;

/**
 * [module: auth, action: write, async: false] - REGISTER FORM
 * Form object rendered by <CardForm> for new user registration.
 */
export const AuthCreateSchema = z.object({
    email: z.string().email("Un'email valida è richiesta"),
    password: z.string().min(6, "La password deve contenere almeno 6 caratteri"),
    firstName: z.string().min(2, "Il nome è richiesto"),
    lastName: z.string().min(2, "Il cognome è richiesto"),
    companyName: z.string().optional(),
});
export type AuthCreate = z.infer<typeof AuthCreateSchema>;

/**
 * Root Schema stored in /auths/[authId] upon Registration / Login.
 */
export const AuthCreateDbSchema = DbSchema.extend({
    uid: z.string(), // Auth provider UID
    email: z.string().email(),
    status: z.enum(["active", "suspended", "pending"]),
    joinedAt: z.date(),
});
export type AuthCreateDb = z.infer<typeof AuthCreateDbSchema>;

/**
 * [module: auth, action: update, async: false] - SESSION REFRESH
 * Database Schema to refresh/maintain the session active.
 */
export const AuthUpdateDbSchema = z.object({
    lastActiveAt: z.date(),
    refreshToken: z.string().optional()
});
export type AuthUpdateDb = z.infer<typeof AuthUpdateDbSchema>;

/**
 * [module: auth, action: delete] - LOGOUT
 * Database Schema to instruct the safe teardown of a session.
 */
export const AuthDeleteDbSchema = z.object({
    terminatedAt: z.date(),
    reason: z.enum(["user_logout", "timeout", "security_revoke"]).default("user_logout")
});
export type AuthDeleteDb = z.infer<typeof AuthDeleteDbSchema>;


