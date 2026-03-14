import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema, BaseNodeSchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";

export const SketchSchema = BaseSchema.extend({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    width: z.number().optional().describe("Width in meters"),
    depth: z.number().optional().describe("Depth in meters"),
    height: z.number().optional().describe("Height in meters"),

    // Spatial properties for handling instances
    dimension: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
});

export type Sketch = z.infer<typeof SketchSchema>;

// --- SUBCOLLECTION SCHEMAS ---

export const SketchMeshNodeSchema = BaseNodeSchema.extend({
    meshId: z.string()
});
export type SketchMeshNode = z.infer<typeof SketchMeshNodeSchema>;

export const SketchPartNodeSchema = BaseNodeSchema.extend({
    partId: z.string()
});
export type SketchPartNode = z.infer<typeof SketchPartNodeSchema>;

export const SketchAssemblyNodeSchema = BaseNodeSchema.extend({
    assemblyId: z.string()
});
export type SketchAssemblyNode = z.infer<typeof SketchAssemblyNodeSchema>;

export const SketchBundleNodeSchema = BaseNodeSchema.extend({
    bundleId: z.string()
});
export type SketchBundleNode = z.infer<typeof SketchBundleNodeSchema>;

export const SketchDesignNodeSchema = BaseNodeSchema.extend({
    designId: z.string()
});
export type SketchDesignNode = z.infer<typeof SketchDesignNodeSchema>;

// --- API SCHEMAS ---

export const SketchCreateSchema = createCreationSchema(SketchSchema);
export const SketchUpdateSchema = createUpdateSchema(SketchSchema);
export const SketchSearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
});

// --- RBAC POLICY MATRIX ---

export const SketchPolicyMatrix: Record<RoleId, EntityPolicy> = {
    guest: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    pending: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: false, fieldPermissions: {} },
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
    standlo_manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: { id: { read: true, write: true }, orgId: { read: true, write: true }, name: { read: true, write: true }, code: { read: true, write: true }, ownId: { read: true, write: true }, active: { read: true, write: true }, version: { read: true, write: true }, users: { read: true, write: true }, updates: { read: true, write: true }, meta: { read: true, write: true }, createdAt: { read: true, write: true }, createdBy: { read: true, write: true }, updatedAt: { read: true, write: true }, updatedBy: { read: true, write: true }, deletedAt: { read: true, write: true }, deletedBy: { read: true, write: true }, isArchived: { read: true, write: true }, endLifeTime: { read: true, write: true }, dimension: { read: true, write: true }, position: { read: true, write: true }, rotation: { read: true, write: true }, width: { read: true, write: true }, depth: { read: true, write: true }, height: { read: true, write: true } } },
    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_designer: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: { id: { read: true, write: true }, orgId: { read: true, write: true }, name: { read: true, write: true }, code: { read: true, write: true }, ownId: { read: true, write: true }, active: { read: true, write: true }, version: { read: true, write: true }, users: { read: true, write: true }, updates: { read: true, write: true }, meta: { read: true, write: true }, createdAt: { read: true, write: true }, createdBy: { read: true, write: true }, updatedAt: { read: true, write: true }, updatedBy: { read: true, write: true }, deletedAt: { read: true, write: true }, deletedBy: { read: true, write: true }, isArchived: { read: true, write: true }, endLifeTime: { read: true, write: true }, dimension: { read: true, write: true }, position: { read: true, write: true }, rotation: { read: true, write: true }, width: { read: true, write: true }, depth: { read: true, write: true }, height: { read: true, write: true } } }
};
