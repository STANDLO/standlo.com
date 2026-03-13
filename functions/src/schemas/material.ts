import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";
/**
 * Material Schema
 * Defines physical properties for PBR rendering in Three.js
 */
export const MaterialSchema = BaseSchema.extend({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    // Base color or texture
    baseColor: z.string().default("#ffffff"), // Used if albedoId is missing
    // Map references (links to TextureSchema documents)
    albedoId: z.string().optional(), // Main diffuse/color map
    normalId: z.string().optional(), // Normal map
    roughnessId: z.string().optional(), // Roughness map
    // Physical properties
    roughness: z.number().min(0).max(1).default(0.5),
    metalness: z.number().min(0).max(1).default(0),
    opacity: z.number().min(0).max(1).default(1),
    transparent: z.boolean().default(false),
    
    // Photorealistic Tiling
    repeatX: z.number().min(0.1).default(1),
    repeatY: z.number().min(0.1).default(1),
    
    // Photorealistic Varnish / Laccatura
    clearcoat: z.number().min(0).max(1).optional(),
    clearcoatRoughness: z.number().min(0).max(1).optional(),
    
    // Photorealistic Fabric / Moquette
    sheen: z.number().min(0).max(1).optional(),
    sheenRoughness: z.number().min(0).max(1).optional(),
    
    // Photorealistic Glass / Vetro
    transmission: z.number().min(0).max(1).optional(),
    ior: z.number().min(1).max(2.333).optional(), // 1 to Diamond

    // RigidBody Engines (Rapier)
    friction: z.number().min(0).max(1).default(0.5),
    restitution: z.number().min(0).max(1).default(0),
    mass: z.number().min(0).optional(),
});
export type Material = z.infer<typeof MaterialSchema>;
export const MaterialCreateSchema = createCreationSchema(MaterialSchema);
export const MaterialUpdateSchema = createUpdateSchema(MaterialSchema);
export const MaterialSearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
});
export const MaterialPolicyMatrix: Record<RoleId, EntityPolicy> = {
    guest: {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        fieldPermissions: {}
    },
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
    standlo_manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
