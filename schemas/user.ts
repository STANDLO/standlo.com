import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const UserTypeSchema = z.enum(["ADMIN", "DESIGNER", "WORKER", "COLLAB"]);
export type UserType = z.infer<typeof UserTypeSchema>;

export const UserSchema = z.object({
    email: z.string().email(),
    displayName: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    birthday: z.string().optional(),
    claims: z.record(z.string(), z.any()).optional(),
    type: UserTypeSchema.optional(),
    active: z.boolean().default(false).optional(),
});
export type User = z.infer<typeof UserSchema>;
export const UserDbSchema = DbSchema.merge(UserSchema);
export type UserDbEntity = z.infer<typeof UserDbSchema>;
