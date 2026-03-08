import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema, BaseNodeSchema, BaseProcessSchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";
export const StandSchema = BaseSchema.extend({
    // Financial properties
    cost: z.number().optional().describe("Internal standard cost"),
    price: z.number().optional().describe("External standard price"),
});
export type Stand = z.infer<typeof StandSchema>;
// --- SUBCOLLECTION SCHEMAS ---
export const StandAssemblyNodeSchema = BaseNodeSchema.extend({
    assemblyId: z.string()
});
export type StandAssemblyNode = z.infer<typeof StandAssemblyNodeSchema>;
export const StandBundleNodeSchema = BaseNodeSchema.extend({
    bundleId: z.string()
});
export type StandBundleNode = z.infer<typeof StandBundleNodeSchema>;
export const StandPartNodeSchema = BaseNodeSchema.extend({
    partId: z.string()
});
export type StandPartNode = z.infer<typeof StandPartNodeSchema>;
export const StandProcessNodeSchema = BaseProcessSchema.extend({});
export type StandProcessNode = z.infer<typeof StandProcessNodeSchema>;
export const StandCreateSchema = createCreationSchema(StandSchema);
export const StandUpdateSchema = createUpdateSchema(StandSchema);
export const StandSearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
});
export const StandPolicyMatrix: Record<RoleId, EntityPolicy> = {
    pending: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    architect: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    engineer: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    designer: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
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
    dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
