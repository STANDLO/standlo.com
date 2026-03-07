"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialPolicyMatrix = exports.MaterialSearchSchema = exports.MaterialUpdateSchema = exports.MaterialCreateSchema = exports.MaterialSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
/**
 * Material Schema
 * Defines physical properties for PBR rendering in Three.js
 */
exports.MaterialSchema = base_1.BaseSchema.extend({
    name: zod_1.z.string().min(1, "Name is required"),
    description: zod_1.z.string().optional(),
    // Base color or texture
    baseColor: zod_1.z.string().default("#ffffff"), // Used if albedoId is missing
    // Map references (links to TextureSchema documents)
    albedoId: zod_1.z.string().optional(), // Main diffuse/color map
    normalId: zod_1.z.string().optional(), // Normal map
    roughnessId: zod_1.z.string().optional(), // Roughness map
    // Physical properties
    roughness: zod_1.z.number().min(0).max(1).default(0.5),
    metalness: zod_1.z.number().min(0).max(1).default(0),
    opacity: zod_1.z.number().min(0).max(1).default(1),
    transparent: zod_1.z.boolean().default(false),
});
exports.MaterialCreateSchema = (0, base_1.createCreationSchema)(exports.MaterialSchema);
exports.MaterialUpdateSchema = (0, base_1.createUpdateSchema)(exports.MaterialSchema);
exports.MaterialSearchSchema = base_1.PaginationQuerySchema.extend({
    name: zod_1.z.string().optional(),
});
exports.MaterialPolicyMatrix = {
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
//# sourceMappingURL=material.js.map