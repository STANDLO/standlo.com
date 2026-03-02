import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";
import { LocalizedStringSchema } from "./primitives";

export const ProcessRoleSchema = z.enum([
    'manager', 'architect', 'engineer', 'designer', 'electrician', 'plumber',
    'carpenter', 'cabinetmaker', 'dryliner', 'ironworker', 'windowfitter',
    'glazier', 'riggers', 'standbuilder', 'plasterer', 'painter', 'tiler',
    'driver', 'forkliftdriver', 'promoter'
]);

export const ProcessSchema = BaseSchema.extend({
    name: LocalizedStringSchema,
    description: LocalizedStringSchema.optional(),
    requiredRole: ProcessRoleSchema.optional(), // Skill Matching & Security
    timeMatrix: z.array(z.object({
        quantityThreshold: z.number(), // e.g. up to 1, up to 10
        setupTimeMinutes: z.number(), // Prep time
        executionTimeMinutes: z.number(), // Execution time per unit
        cleanupTimeMinutes: z.number() // Cleanup time
    })).default([])
});
export type Process = z.infer<typeof ProcessSchema>;

export const ProcessCreateSchema = createCreationSchema(ProcessSchema);
export const ProcessUpdateSchema = createUpdateSchema(ProcessSchema);
export const ProcessSearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
    requiredRole: ProcessRoleSchema.optional(),
});

export const ProcessPolicyMatrix: Record<RoleId, EntityPolicy> = {
    pending: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    standlo_design: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    engineer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    electrician: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plumber: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    carpenter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    cabinetmaker: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    ironworker: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    windowfitter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    glazier: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    riggers: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standbuilder: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plasterer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    painter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    tiler: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    driver: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    forkliftdriver: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    promoter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    other: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
