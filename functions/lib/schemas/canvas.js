"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasSchema = exports.CanvasNodeSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
exports.CanvasNodeSchema = zod_1.z.lazy(() => zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.enum(["mesh", "group", "light", "camera", "assemblyRef"]),
    name: zod_1.z.string(),
    position: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()]).default([0, 0, 0]),
    rotation: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()]).default([0, 0, 0]),
    scale: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()]).default([1, 1, 1]),
    geometryType: zod_1.z.enum(["box", "plane", "cylinder", "sphere", "custom"]).optional(),
    geometryArgs: zod_1.z.array(zod_1.z.number()).optional(),
    materialId: zod_1.z.string().optional(),
    faceMaterials: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
    children: zod_1.z.array(exports.CanvasNodeSchema).optional(),
}));
/**
 * Main Canvas Document (Part, Assembly, or Stand)
 */
exports.CanvasSchema = base_1.BaseSchema.extend({
    name: zod_1.z.string().min(1, "Name is required"),
    description: zod_1.z.string().optional(),
    type: zod_1.z.enum(["part", "assembly", "stand"]),
    // Array of root nodes in the scene
    nodes: zod_1.z.array(exports.CanvasNodeSchema).default([]),
    // Link to the user who created/owns this canvas
    ownerId: zod_1.z.string(),
    // (Optional) Links to commercial entities if this canvas is tied to a real-world object
    relatedProjectId: zod_1.z.string().optional(),
    relatedStandId: zod_1.z.string().optional(),
});
//# sourceMappingURL=canvas.js.map