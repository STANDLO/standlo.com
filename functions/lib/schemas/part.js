"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartPolicyMatrix = exports.PartSearchSchema = exports.PartUpdateSchema = exports.PartCreateSchema = exports.PartToolNodeSchema = exports.PartProcessNodeSchema = exports.PartSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
const primitives_1 = require("./primitives");
exports.PartSchema = base_1.BaseSchema.extend({
    name: primitives_1.LocalizedStringSchema,
    description: primitives_1.LocalizedStringSchema.optional(),
    sector: zod_1.z.string(), // e.g. construction, exhibition
    layer: zod_1.z.string(), // e.g. rigging, floor, wall
    isRentable: zod_1.z.boolean().default(true),
    isSellable: zod_1.z.boolean().default(true),
    isConsumable: zod_1.z.boolean().default(false), // Consumables vs Assets
    baseUnit: zod_1.z.string().default('pcs'), // 'pcs', 'sqm', 'lm'
    variantsDefinition: zod_1.z.array(zod_1.z.object({
        attribute: zod_1.z.string(), // e.g. 'width_cm'
        type: zod_1.z.enum(['string', 'number', 'boolean']),
        options: zod_1.z.array(zod_1.z.union([zod_1.z.string(), zod_1.z.number()])).optional()
    })).optional(),
    gltfUrl: zod_1.z.string().optional().describe("URL to the Draco-compressed .glb file stored in Firebase Storage"),
    sockets: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string(),
        type: zod_1.z.enum(['male', 'female', 'neutral']),
        position: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()]).describe("[x, y, z] coordinates relative to part center"),
        rotation: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number(), zod_1.z.number()]).optional().describe("Quaternion [x, y, z, w] for socket orientation")
    })).default([]),
});
// --- SUBCOLLECTION SCHEMAS ---
exports.PartProcessNodeSchema = zod_1.z.object({
    processId: zod_1.z.string(),
    quantity: zod_1.z.number()
});
exports.PartToolNodeSchema = zod_1.z.object({
    toolId: zod_1.z.string(),
    quantity: zod_1.z.number()
});
exports.PartCreateSchema = (0, base_1.createCreationSchema)(exports.PartSchema);
exports.PartUpdateSchema = (0, base_1.createUpdateSchema)(exports.PartSchema);
exports.PartSearchSchema = base_1.PaginationQuerySchema.extend({
    name: zod_1.z.string().optional(),
    sector: zod_1.z.string().optional(),
    layer: zod_1.z.string().optional(),
});
exports.PartPolicyMatrix = {
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
//# sourceMappingURL=part.js.map