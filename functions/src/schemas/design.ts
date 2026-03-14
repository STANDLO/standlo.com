import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema, BaseNodeSchema, BaseProcessSchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";

export const MeshOverrideSchema = z.object({
    meshId: z.string(),
    materialId: z.string().optional(),
    textureId: z.string().optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/i).optional(), 
    visible: z.boolean().default(true),
    opacity: z.number().min(0).max(1).default(1)
});

export const DesignObjectSchema = BaseSchema.extend({
    id: z.string(), 
    type: z.string(), 
    baseEntityId: z.string(), 
    name: z.string(), 
    layerId: z.string().default("strutture"), 
    position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    order: z.number().int().default(0), 
    meshOverrides: z.record(z.string(), MeshOverrideSchema).optional(),
});

export type DesignObject = z.infer<typeof DesignObjectSchema>;
export type MeshOverride = z.infer<typeof MeshOverrideSchema>;

export const DesignSchema = BaseSchema.extend({
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(["stand", "bedroom", "bathroom", "kitchen", "office"]).default("stand"),
    // Financial properties
    cost: z.number().optional().describe("Internal standard cost"),
    price: z.number().optional().describe("External standard price"),

    // Spatial properties for handling instances
    dimension: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
});
export type Design = z.infer<typeof DesignSchema>;
// --- SUBCOLLECTION SCHEMAS ---
export const DesignAssemblyNodeSchema = BaseNodeSchema.extend({
    assemblyId: z.string()
});
export type DesignAssemblyNode = z.infer<typeof DesignAssemblyNodeSchema>;
export const DesignBundleNodeSchema = BaseNodeSchema.extend({
    bundleId: z.string()
});
export type DesignBundleNode = z.infer<typeof DesignBundleNodeSchema>;
export const DesignPartNodeSchema = BaseNodeSchema.extend({
    partId: z.string()
});
export type DesignPartNode = z.infer<typeof DesignPartNodeSchema>;
export const DesignProcessNodeSchema = BaseProcessSchema.extend({});
export type DesignProcessNode = z.infer<typeof DesignProcessNodeSchema>;
export const DesignCreateSchema = createCreationSchema(DesignSchema);
export const DesignUpdateSchema = createUpdateSchema(DesignSchema);
export const DesignSearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
});
export const DesignPolicyMatrix: Record<RoleId, EntityPolicy> = {
    guest: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: { id: { read: true, write: false }, orgId: { read: true, write: false }, name: { read: true, write: false }, code: { read: true, write: false }, ownId: { read: true, write: false }, active: { read: true, write: false }, version: { read: true, write: false }, users: { read: true, write: false }, updates: { read: true, write: false }, meta: { read: true, write: false }, createdAt: { read: true, write: false }, createdBy: { read: true, write: false }, updatedAt: { read: true, write: false }, updatedBy: { read: true, write: false }, deletedAt: { read: true, write: false }, deletedBy: { read: true, write: false }, isArchived: { read: true, write: false }, endLifeTime: { read: true, write: false }, dimension: { read: true, write: false }, position: { read: true, write: false }, rotation: { read: true, write: false }, cost: { read: true, write: false }, price: { read: true, write: false } } },
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
    standlo_manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: { id: { read: true, write: true }, orgId: { read: true, write: true }, name: { read: true, write: true }, code: { read: true, write: true }, ownId: { read: true, write: true }, active: { read: true, write: true }, version: { read: true, write: true }, users: { read: true, write: true }, updates: { read: true, write: true }, meta: { read: true, write: true }, createdAt: { read: true, write: true }, createdBy: { read: true, write: true }, updatedAt: { read: true, write: true }, updatedBy: { read: true, write: true }, deletedAt: { read: true, write: true }, deletedBy: { read: true, write: true }, isArchived: { read: true, write: true }, endLifeTime: { read: true, write: true }, dimension: { read: true, write: true }, position: { read: true, write: true }, rotation: { read: true, write: true }, cost: { read: true, write: true }, price: { read: true, write: true } } },
    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_designer: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: { id: { read: true, write: true }, orgId: { read: true, write: true }, name: { read: true, write: true }, code: { read: true, write: true }, ownId: { read: true, write: true }, active: { read: true, write: true }, version: { read: true, write: true }, users: { read: true, write: true }, updates: { read: true, write: true }, meta: { read: true, write: true }, createdAt: { read: true, write: true }, createdBy: { read: true, write: true }, updatedAt: { read: true, write: true }, updatedBy: { read: true, write: true }, deletedAt: { read: true, write: true }, deletedBy: { read: true, write: true }, isArchived: { read: true, write: true }, endLifeTime: { read: true, write: true }, dimension: { read: true, write: true }, position: { read: true, write: true }, rotation: { read: true, write: true }, cost: { read: true, write: true }, price: { read: true, write: true } } }
};
