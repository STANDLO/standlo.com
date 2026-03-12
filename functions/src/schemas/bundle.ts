import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema, BaseNodeSchema, BaseProcessSchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";
export const BundleSchema = BaseSchema.extend({
    name: z.string(),
    description: z.string().optional(),
    // Bundles are field-assembled virtual groups, so locationType is generally site.
    locationType: z.enum(['warehouse', 'site']).default('site'),
    // Financial properties dynamically derived from parts/processes
    cost: z.number().optional().describe("Internal standard cost"),
    price: z.number().optional().describe("External standard price"),
    gltfUrl: z.string().optional().describe("URL to a pre-baked .glb representation of this bundle (optional)"),
    sockets: z.array(z.object({
        id: z.string(),
        type: z.enum(['male', 'female', 'neutral']),
        position: z.tuple([z.number(), z.number(), z.number()]).describe("[x, y, z] coordinates relative to bundle center"),
        rotation: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional().describe("Quaternion [x, y, z, w] for socket orientation")
    })).default([]),
});
export type Bundle = z.infer<typeof BundleSchema>;
// --- SUBCOLLECTION SCHEMAS (Identical to Assemblies structurally) ---
export const BundlePartNodeSchema = BaseNodeSchema.extend({
    partId: z.string()
});
export type BundlePartNode = z.infer<typeof BundlePartNodeSchema>;
export const BundleProcessNodeSchema = BaseProcessSchema.extend({});
export type BundleProcessNode = z.infer<typeof BundleProcessNodeSchema>;
export const BundleCreateSchema = createCreationSchema(BundleSchema);
export const BundleUpdateSchema = createUpdateSchema(BundleSchema);
export const BundleSearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
    locationType: z.enum(['warehouse', 'site']).optional(),
});
export const BundlePolicyMatrix: Record<RoleId, EntityPolicy> = {
    guest: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: { id: { read: true, write: false }, orgId: { read: true, write: false }, name: { read: true, write: false }, code: { read: true, write: false }, ownId: { read: true, write: false }, active: { read: true, write: false }, version: { read: true, write: false }, users: { read: true, write: false }, updates: { read: true, write: false }, meta: { read: true, write: false }, createdAt: { read: true, write: false }, createdBy: { read: true, write: false }, updatedAt: { read: true, write: false }, updatedBy: { read: true, write: false }, deletedAt: { read: true, write: false }, deletedBy: { read: true, write: false }, isArchived: { read: true, write: false }, endLifeTime: { read: true, write: false }, description: { read: true, write: false }, locationType: { read: true, write: false }, cost: { read: true, write: false }, price: { read: true, write: false }, gltfUrl: { read: true, write: false }, sockets: { read: true, write: false } } },
    pending: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
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
    dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: { id: { read: true, write: true }, orgId: { read: true, write: true }, name: { read: true, write: true }, code: { read: true, write: true }, ownId: { read: true, write: true }, active: { read: true, write: true }, version: { read: true, write: true }, users: { read: true, write: true }, updates: { read: true, write: true }, meta: { read: true, write: true }, createdAt: { read: true, write: true }, createdBy: { read: true, write: true }, updatedAt: { read: true, write: true }, updatedBy: { read: true, write: true }, deletedAt: { read: true, write: true }, deletedBy: { read: true, write: true }, isArchived: { read: true, write: true }, endLifeTime: { read: true, write: true }, description: { read: true, write: true }, locationType: { read: true, write: true }, cost: { read: true, write: true }, price: { read: true, write: true }, gltfUrl: { read: true, write: true }, sockets: { read: true, write: true } } },
    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_designer: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: { id: { read: true, write: true }, orgId: { read: true, write: true }, name: { read: true, write: true }, code: { read: true, write: true }, ownId: { read: true, write: true }, active: { read: true, write: true }, version: { read: true, write: true }, users: { read: true, write: true }, updates: { read: true, write: true }, meta: { read: true, write: true }, createdAt: { read: true, write: true }, createdBy: { read: true, write: true }, updatedAt: { read: true, write: true }, updatedBy: { read: true, write: true }, deletedAt: { read: true, write: true }, deletedBy: { read: true, write: true }, isArchived: { read: true, write: true }, endLifeTime: { read: true, write: true }, description: { read: true, write: true }, locationType: { read: true, write: true }, cost: { read: true, write: true }, price: { read: true, write: true }, gltfUrl: { read: true, write: true }, sockets: { read: true, write: true } } }
};
