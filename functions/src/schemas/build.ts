import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";

export const BuildSchema = BaseSchema.extend({
    name: z.string().describe("Name or identifier of the modular construction project"),
    description: z.string().optional(),
    location: z.string().optional(),
});
export type Build = z.infer<typeof BuildSchema>;

// --- SUBCOLLECTION SCHEMAS ---
export const BuildCanvasNodeSchema = z.object({
    entityId: z.string().describe("Can be a Part ID or an Assembly ID"),
    entityType: z.enum(['part', 'assembly']),
    position: z.tuple([z.number(), z.number(), z.number()]),
    rotation: z.tuple([z.number(), z.number(), z.number(), z.number()])
});
export type BuildCanvasNode = z.infer<typeof BuildCanvasNodeSchema>;

export const BuildAssemblyNodeSchema = z.object({
    assemblyId: z.string(),
    quantity: z.number()
});
export type BuildAssemblyNode = z.infer<typeof BuildAssemblyNodeSchema>;

export const BuildPartNodeSchema = z.object({
    partId: z.string(),
    quantity: z.number()
});
export type BuildPartNode = z.infer<typeof BuildPartNodeSchema>;

export const BuildProcessNodeSchema = z.object({
    processId: z.string(),
    quantity: z.number()
});
export type BuildProcessNode = z.infer<typeof BuildProcessNodeSchema>;

export const BuildToolNodeSchema = z.object({
    toolId: z.string(),
    quantity: z.number()
});
export type BuildToolNode = z.infer<typeof BuildToolNodeSchema>;


export const BuildCreateSchema = createCreationSchema(BuildSchema);
export const BuildUpdateSchema = createUpdateSchema(BuildSchema);
export const BuildSearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
});

export const BuildPolicyMatrix: Record<RoleId, EntityPolicy> = {
    pending: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    architect: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    engineer: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    designer: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    standlo_design: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
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
