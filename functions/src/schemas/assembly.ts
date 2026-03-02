import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";
import { LocalizedStringSchema } from "./primitives";

export const AssemblySchema = BaseSchema.extend({
    name: LocalizedStringSchema,
    description: LocalizedStringSchema.optional(),
    locationType: z.enum(['warehouse', 'site']).default('warehouse'),
    gltfUrl: z.string().optional().describe("URL to a pre-baked .glb representation of this assembly (optional)"),
    sockets: z.array(z.object({
        id: z.string(),
        type: z.enum(['male', 'female', 'neutral']),
        position: z.tuple([z.number(), z.number(), z.number()]).describe("[x, y, z] coordinates relative to assembly center"),
        rotation: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional().describe("Quaternion [x, y, z, w] for socket orientation")
    })).default([]),
});
export type Assembly = z.infer<typeof AssemblySchema>;

// --- SUBCOLLECTION SCHEMAS ---
export const AssemblyPartNodeSchema = z.object({
    partId: z.string(),
    quantity: z.number()
});
export type AssemblyPartNode = z.infer<typeof AssemblyPartNodeSchema>;

export const AssemblyProcessNodeSchema = z.object({
    processId: z.string(),
    quantity: z.number()
});
export type AssemblyProcessNode = z.infer<typeof AssemblyProcessNodeSchema>;

export const AssemblyToolNodeSchema = z.object({
    toolId: z.string(),
    quantity: z.number()
});
export type AssemblyToolNode = z.infer<typeof AssemblyToolNodeSchema>;

export const AssemblyCanvasNodeSchema = z.object({
    partId: z.string(),
    position: z.tuple([z.number(), z.number(), z.number()]),
    rotation: z.tuple([z.number(), z.number(), z.number(), z.number()])
});
export type AssemblyCanvasNode = z.infer<typeof AssemblyCanvasNodeSchema>;

export const AssemblyCreateSchema = createCreationSchema(AssemblySchema);
export const AssemblyUpdateSchema = createUpdateSchema(AssemblySchema);
export const AssemblySearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
    locationType: z.enum(['warehouse', 'site']).optional(),
});

export const AssemblyPolicyMatrix: Record<RoleId, EntityPolicy> = {
    pending: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    engineer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
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
