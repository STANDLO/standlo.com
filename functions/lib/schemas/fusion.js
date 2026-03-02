"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FusionPolicyMatrix = exports.FusionSchema = exports.FusionPartsSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
/**
 * FusionPartsSchema
 * Represents a child node in a recursive tree, mirroring the generic structure
 * outputted by the MilanoStand Plugin in Fusion 360.
 */
exports.FusionPartsSchema = zod_1.z.lazy(() => zod_1.z.object({
    fusionId: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    category: zod_1.z.string().optional(),
    quantity: zod_1.z.number().int().nonnegative().optional().default(1),
    price: zod_1.z.number().int().nonnegative().optional().default(0),
    cost: zod_1.z.number().int().nonnegative().optional().default(0),
    startup: zod_1.z.number().int().nonnegative().optional().default(0),
    modelUrl: zod_1.z.string().url().optional(),
    drawingUrl: zod_1.z.string().url().optional(),
    type: zod_1.z.enum(["Part", "Assembly", "Hybrid"]).optional(),
    inventoryType: zod_1.z.enum(["Asset", "Consumable", "Bulk Consumable", "Service"]).optional(),
    version: zod_1.z.number().int().nonnegative().optional(),
    parts: zod_1.z.array(zod_1.z.lazy(() => exports.FusionPartsSchema)).optional(),
}));
/**
 * FusionSchema
 *
 * Agnostic repository for CAD metadata and 3D assets synchronized from the
 * Fusion 360 Plugin. This data layer sits behind commercial entities (like `Part` and `Assembly`),
 * so that multiple products can reference the same CAD geometry.
 */
exports.FusionSchema = base_1.BaseSchema.extend({
    fusionId: zod_1.z.string().describe("The root Lineage ID from Fusion 360"),
    type: zod_1.z.enum(["part", "assembly", "hybrid"]).describe("Component behavior type"),
    version: zod_1.z.number().int().positive().describe("Current iteration version derived from Fusion"),
    glbUrl: zod_1.z.string().url().optional().describe("Cloud storage URL pointing to the .glb web model"),
    designerEmail: zod_1.z.string().email().optional().describe("Email of the designer who last synced this iteration"),
    parts: zod_1.z.array(exports.FusionPartsSchema).optional().describe("Recursive tree of child components for assemblies"),
});
/**
 * Access Control limits arbitrary writes.
 * The 'plugin' role (service account) or a verified 'designer' token can create these records.
 */
exports.FusionPolicyMatrix = {
    admin: { read: true, write: true, delete: true },
    manager: { read: true, write: false, delete: false },
    designer: { read: true, write: true, delete: false },
    marketing: { read: true, write: false, delete: false },
    operations: { read: true, write: false, delete: false },
    warehouse: { read: true, write: false, delete: false },
    system: { read: true, write: true, delete: true },
};
//# sourceMappingURL=fusion.js.map