import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";
/**
 * Mesh Schema
 * Establishes the primitive 3D geometry layer for the Standlo PDM architecture
 */
export const MeshSchema = BaseSchema.extend({
    geometryType: z.enum(["box", "plane", "cylinder", "sphere", "custom"]).default("box"),
    dimensions: z.tuple([z.number(), z.number(), z.number()]).optional(),
    position: z.tuple([z.literal(0), z.literal(0), z.literal(0)]).default([0, 0, 0]).describe("Mesh origin is always absolute 0,0,0"),
    materialId: z.string().optional().describe("ID referencing a Material document"),
});
export type Mesh = z.infer<typeof MeshSchema>;
export const MeshCreateSchema = createCreationSchema(MeshSchema);
export const MeshUpdateSchema = createUpdateSchema(MeshSchema);
export const MeshSearchSchema = PaginationQuerySchema.extend({
    geometryType: z.string().optional(),
});
export const MeshPolicyMatrix: Record<RoleId, EntityPolicy> = {
    guest: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: { id: { read: true, write: false }, orgId: { read: true, write: false }, name: { read: true, write: false }, code: { read: true, write: false }, ownId: { read: true, write: false }, active: { read: true, write: false }, version: { read: true, write: false }, users: { read: true, write: false }, updates: { read: true, write: false }, meta: { read: true, write: false }, createdAt: { read: true, write: false }, createdBy: { read: true, write: false }, updatedAt: { read: true, write: false }, updatedBy: { read: true, write: false }, deletedAt: { read: true, write: false }, deletedBy: { read: true, write: false }, isArchived: { read: true, write: false }, endLifeTime: { read: true, write: false }, geometryType: { read: true, write: false }, dimensions: { read: true, write: false }, position: { read: true, write: false }, materialId: { read: true, write: false } } },
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
    standlo_manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: { id: { read: true, write: true }, orgId: { read: true, write: true }, name: { read: true, write: true }, code: { read: true, write: true }, ownId: { read: true, write: true }, active: { read: true, write: true }, version: { read: true, write: true }, users: { read: true, write: true }, updates: { read: true, write: true }, meta: { read: true, write: true }, createdAt: { read: true, write: true }, createdBy: { read: true, write: true }, updatedAt: { read: true, write: true }, updatedBy: { read: true, write: true }, deletedAt: { read: true, write: true }, deletedBy: { read: true, write: true }, isArchived: { read: true, write: true }, endLifeTime: { read: true, write: true }, geometryType: { read: true, write: true }, dimensions: { read: true, write: true }, position: { read: true, write: true }, materialId: { read: true, write: true } } },
    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_designer: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: { id: { read: true, write: true }, orgId: { read: true, write: true }, name: { read: true, write: true }, code: { read: true, write: true }, ownId: { read: true, write: true }, active: { read: true, write: true }, version: { read: true, write: true }, users: { read: true, write: true }, updates: { read: true, write: true }, meta: { read: true, write: true }, createdAt: { read: true, write: true }, createdBy: { read: true, write: true }, updatedAt: { read: true, write: true }, updatedBy: { read: true, write: true }, deletedAt: { read: true, write: true }, deletedBy: { read: true, write: true }, isArchived: { read: true, write: true }, endLifeTime: { read: true, write: true }, geometryType: { read: true, write: true }, dimensions: { read: true, write: true }, position: { read: true, write: true }, materialId: { read: true, write: true } } }
};
