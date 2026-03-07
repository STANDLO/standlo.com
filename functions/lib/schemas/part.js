"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartPolicyMatrix = exports.PartSearchSchema = exports.PartUpdateSchema = exports.PartCreateSchema = exports.PartToolNodeSchema = exports.PartProcessNodeSchema = exports.PartSchema = exports.PART_CATEGORIES_BY_SECTOR = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
const primitives_1 = require("./primitives");
exports.PART_CATEGORIES_BY_SECTOR = {
    exhibition: {
        wood_panel: "Wood Panel",
        furniture: "Furniture",
        display: "Display",
        structure: "Structure",
        graphic: "Graphic",
        lighting: "Lighting",
        rigging: "Rigging",
        decor: "Decor",
        other: "Other"
    },
    construction: {
        wood_panel: "Wood Panel",
        metal_structure: "Metal Structure",
        floor_panel: "Floor Panel",
        glass: "Glass",
        fasteners: "Fasteners",
        paint: "Paint",
        other: "Other"
    },
    audio_video: {
        screen: "Screen",
        audio_setup: "Audio Setup",
        cables: "Cables",
        camera: "Camera",
        other: "Other"
    },
    electrical: {
        lighting: "Lighting",
        cables: "Cables",
        switch: "Switch",
        socket: "Socket",
        other: "Other"
    }
};
exports.PartSchema = base_1.BaseSchema.extend({
    name: zod_1.z.string(),
    description: primitives_1.LocalizedStringSchema.optional(),
    sector: zod_1.z.string(), // e.g. construction, exhibition
    category: zod_1.z.string(), // e.g. Wood Panel, Fasteners, Cables
    isRentable: zod_1.z.boolean().default(true),
    isSellable: zod_1.z.boolean().default(true),
    isConsumable: zod_1.z.boolean().default(false), // Consumables vs Assets
    baseUnit: zod_1.z.string().default('pcs'), // 'pcs', 'sqm', 'lm'
    // Spatial properties for handling instances
    position: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()]).default([0, 0, 0]),
    rotation: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()]).default([0, 0, 0]),
    // Financial properties
    cost: zod_1.z.number().optional().describe("Internal standard cost"),
    price: zod_1.z.number().optional().describe("External standard price"),
    meshId: zod_1.z.string().optional().describe("ID della Mesh di base da cui ereditare la geometria e il materiale nativo"),
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
    id: zod_1.z.string().uuid(),
    processId: zod_1.z.string(),
    quantity: zod_1.z.number()
});
exports.PartToolNodeSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    toolId: zod_1.z.string(),
    quantity: zod_1.z.number()
});
exports.PartCreateSchema = (0, base_1.createCreationSchema)(exports.PartSchema);
exports.PartUpdateSchema = (0, base_1.createUpdateSchema)(exports.PartSchema);
exports.PartSearchSchema = base_1.PaginationQuerySchema.extend({
    name: zod_1.z.string().optional(),
    sector: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
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