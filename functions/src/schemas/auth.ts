import { z } from "zod";
import { BaseSchema } from "./base";
import { SystemRoles, RoleIdSchema, RoleId } from "./primitives";
export { SystemRoles, RoleIdSchema };
export type { RoleId };
/*
* Role Schema
*/
export const RoleSchema = BaseSchema.extend({});
export type Role = z.infer<typeof RoleSchema>;
/*
* Auth Event Schema (Event Sourcing)
*/
export const AuthEventSchema = BaseSchema.extend({
    code: z.string().optional(),
    type: z.enum([
        "create",
        "verify",
        "onboarding",
        "login",
        "logout",
        "session_refresh",
        "delete"
    ]),
    uid: z.string(),
    email: z.string().email().optional(),
    // Enriched Fields
    sessionId: z.string().uuid().optional(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional()
});
export type AuthEvent = z.infer<typeof AuthEventSchema>;
export type AuthEventDocument = AuthEvent & { id: string };
