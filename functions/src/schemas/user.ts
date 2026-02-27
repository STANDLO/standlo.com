import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";

export const UserSchema = BaseSchema.extend({
    email: z.string().email(),
    displayName: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    claims: z.record(z.string(), z.any()).optional(),
});

export type User = z.infer<typeof UserSchema>;

export const UserCreateSchema = createCreationSchema(UserSchema);
export const UserUpdateSchema = createUpdateSchema(UserSchema);
export const UserSearchSchema = PaginationQuerySchema.extend({
    email: z.string().optional(),
    roleId: z.string().optional(),
});

// Default minimal policy for system-managed entities (To be expanded as needed)
const defaultPolicy: EntityPolicy = {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    fieldPermissions: {}
};

export const UserPolicyMatrix: Record<RoleId, EntityPolicy> = {
    manager: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        fieldPermissions: {
            email: { read: true, write: true },
            displayName: { read: true, write: true },
            phoneNumber: { read: true, write: true },
        }
    },
    designer: defaultPolicy,
    pending: defaultPolicy,
    customer: defaultPolicy,
    provider: defaultPolicy,
    architect: defaultPolicy,
    engineer: defaultPolicy,
    electrician: defaultPolicy,
    plumber: defaultPolicy,
    carpenter: defaultPolicy,
    cabinetmaker: defaultPolicy,
    ironworker: defaultPolicy,
    windowfitter: defaultPolicy,
    glazier: defaultPolicy,
    riggers: defaultPolicy,
    standbuilder: defaultPolicy,
    plasterer: defaultPolicy,
    painter: defaultPolicy,
    tiler: defaultPolicy,
    driver: defaultPolicy,
    forkliftdriver: defaultPolicy,
    promoter: defaultPolicy,
    other: defaultPolicy,
    dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
