import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";
import { LocalizedStringSchema } from "./primitives";

export const PartSchema = BaseSchema.extend({
    name: LocalizedStringSchema,
    description: LocalizedStringSchema.optional(),
    sector: z.string(), // e.g. construction, exhibition
    layer: z.string(), // e.g. rigging, floor, wall
    isRentable: z.boolean().default(true),
    isSellable: z.boolean().default(true),
    isConsumable: z.boolean().default(false), // Consumables vs Assets
    baseUnit: z.string().default('pcs'), // 'pcs', 'sqm', 'lm'
    variantsDefinition: z.array(z.object({
        attribute: z.string(), // e.g. 'width_cm'
        type: z.enum(['string', 'number', 'boolean']),
        options: z.array(z.union([z.string(), z.number()])).optional()
    })).optional(),
    gltfUrl: z.string().optional().describe("URL to the Draco-compressed .glb file stored in Firebase Storage"),
    sockets: z.array(z.object({
        id: z.string(),
        type: z.enum(['male', 'female', 'neutral']),
        position: z.tuple([z.number(), z.number(), z.number()]).describe("[x, y, z] coordinates relative to part center"),
        rotation: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional().describe("Quaternion [x, y, z, w] for socket orientation")
    })).default([]),
});
export type Part = z.infer<typeof PartSchema>;

// --- SUBCOLLECTION SCHEMAS ---
export const PartProcessNodeSchema = z.object({
    processId: z.string(),
    quantity: z.number()
});
export type PartProcessNode = z.infer<typeof PartProcessNodeSchema>;

export const PartToolNodeSchema = z.object({
    toolId: z.string(),
    quantity: z.number()
});
export type PartToolNode = z.infer<typeof PartToolNodeSchema>;

export const PartCreateSchema = createCreationSchema(PartSchema);
export const PartUpdateSchema = createUpdateSchema(PartSchema);
export const PartSearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
    sector: z.string().optional(),
    layer: z.string().optional(),
});

export const PartPolicyMatrix: Record<RoleId, EntityPolicy> = {
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
