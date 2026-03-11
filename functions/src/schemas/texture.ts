import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";
/**
 * Texture Schema
 * Holds visual data (images or hex colors) for texturing meshes
 */
export const TextureSchema = BaseSchema.extend({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["color", "imageMap", "normalMap", "roughnessMap"]),
    // Multi-Theme Support
    // Can be a Hex color (#ffffff) or a URL to an image asset
    valueLight: z.string(),
    valueDark: z.string().optional(), // Falls back to valueLight if not provided
    // Texture scaling & wrapping parameters
    wrapS: z.enum(["RepeatWrapping", "ClampToEdgeWrapping", "MirroredRepeatWrapping"]).default("RepeatWrapping"),
    wrapT: z.enum(["RepeatWrapping", "ClampToEdgeWrapping", "MirroredRepeatWrapping"]).default("RepeatWrapping"),
    repeat: z.tuple([z.number(), z.number()]).default([1, 1]),
    storageUrl: z.string().optional().describe("URL to the image in Firebase Storage"),
});
export type Texture = z.infer<typeof TextureSchema>;
export const TextureCreateSchema = createCreationSchema(TextureSchema);
export const TextureUpdateSchema = createUpdateSchema(TextureSchema);
export const TextureSearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
    type: z.string().optional(),
});
export const TexturePolicyMatrix: Record<RoleId, EntityPolicy> = {
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
