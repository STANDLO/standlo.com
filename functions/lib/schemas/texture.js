"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TexturePolicyMatrix = exports.TextureSearchSchema = exports.TextureUpdateSchema = exports.TextureCreateSchema = exports.TextureSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
/**
 * Texture Schema
 * Holds visual data (images or hex colors) for texturing meshes
 */
exports.TextureSchema = base_1.BaseSchema.extend({
    name: zod_1.z.string().min(1, "Name is required"),
    type: zod_1.z.enum(["color", "imageMap", "normalMap", "roughnessMap"]),
    // Multi-Theme Support
    // Can be a Hex color (#ffffff) or a URL to an image asset
    valueLight: zod_1.z.string(),
    valueDark: zod_1.z.string().optional(), // Falls back to valueLight if not provided
    // Texture scaling & wrapping parameters
    wrapS: zod_1.z.enum(["RepeatWrapping", "ClampToEdgeWrapping", "MirroredRepeatWrapping"]).default("RepeatWrapping"),
    wrapT: zod_1.z.enum(["RepeatWrapping", "ClampToEdgeWrapping", "MirroredRepeatWrapping"]).default("RepeatWrapping"),
    repeat: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]).default([1, 1]),
    storageUrl: zod_1.z.string().optional().describe("URL to the image in Firebase Storage"),
});
exports.TextureCreateSchema = (0, base_1.createCreationSchema)(exports.TextureSchema);
exports.TextureUpdateSchema = (0, base_1.createUpdateSchema)(exports.TextureSchema);
exports.TextureSearchSchema = base_1.PaginationQuerySchema.extend({
    name: zod_1.z.string().optional(),
    type: zod_1.z.string().optional(),
});
exports.TexturePolicyMatrix = {
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
//# sourceMappingURL=texture.js.map