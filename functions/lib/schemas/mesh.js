"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeshPolicyMatrix = exports.MeshSearchSchema = exports.MeshUpdateSchema = exports.MeshCreateSchema = exports.MeshSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
/**
 * Mesh Schema
 * Establishes the primitive 3D geometry layer for the Standlo PDM architecture
 */
exports.MeshSchema = base_1.BaseSchema.extend({
    geometryType: zod_1.z.enum(["box", "plane", "cylinder", "sphere", "custom"]).default("box"),
    dimensions: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()]).optional(),
    position: zod_1.z.tuple([zod_1.z.literal(0), zod_1.z.literal(0), zod_1.z.literal(0)]).default([0, 0, 0]).describe("Mesh origin is always absolute 0,0,0"),
    materialId: zod_1.z.string().optional().describe("ID referencing a Material document"),
});
exports.MeshCreateSchema = (0, base_1.createCreationSchema)(exports.MeshSchema);
exports.MeshUpdateSchema = (0, base_1.createUpdateSchema)(exports.MeshSchema);
exports.MeshSearchSchema = base_1.PaginationQuerySchema.extend({
    geometryType: zod_1.z.string().optional(),
});
exports.MeshPolicyMatrix = {
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
//# sourceMappingURL=mesh.js.map