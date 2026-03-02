"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasMaterialSchema = exports.CanvasTextureSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
/**
 * Canvas Texture Document
 * Holds visual data (images or hex colors) supporting Light and Dark modes
 */
exports.CanvasTextureSchema = base_1.BaseSchema.extend({
    name: zod_1.z.string().min(1, "Name is required"),
    type: zod_1.z.enum(["color", "imageMap", "normalMap", "roughnessMap"]),
    // Multi-Theme Support
    // Can be a Hex color (#ffffff) or a URL to an image asset
    valueLight: zod_1.z.string(),
    valueDark: zod_1.z.string().optional(), // Falls back to valueLight if not provided
});
/**
 * Canvas Material Document
 * Defines physical properties for PBR rendering in Three.js
 */
exports.CanvasMaterialSchema = base_1.BaseSchema.extend({
    name: zod_1.z.string().min(1, "Name is required"),
    description: zod_1.z.string().optional(),
    // Map references (links to CanvasTextureSchema documents)
    mapId: zod_1.z.string().optional(), // Main diffuse/color map
    normalMapId: zod_1.z.string().optional(),
    roughnessMapId: zod_1.z.string().optional(),
    // Physical properties
    roughness: zod_1.z.number().min(0).max(1).default(0.5),
    metalness: zod_1.z.number().min(0).max(1).default(0),
    opacity: zod_1.z.number().min(0).max(1).default(1),
    transparent: zod_1.z.boolean().default(false),
});
//# sourceMappingURL=canvasMaterial.js.map