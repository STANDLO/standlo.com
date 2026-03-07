"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CanvasCreateSchema = exports.CanvasSchema = exports.CanvasObjectSchema = exports.MeshOverrideSchema = exports.CANVAS_TYPES = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
exports.CANVAS_TYPES = ["part", "assembly", "stand"];
/**
 * Zod Schema for Vector3 values (position, rotation, scale)
 */
const Vector3Schema = zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()]);
/**
 * Override properties for a specific Mesh within an Instance
 */
exports.MeshOverrideSchema = zod_1.z.object({
    textureId: zod_1.z.string().nullable().optional(),
    materialId: zod_1.z.string().nullable().optional(),
    color: zod_1.z.string().nullable().optional(),
});
/**
 * Instance of a Catalog Entity placed in a Canvas
 * This replaces CanvasNode and represents an actual Object3D in the scene
 */
exports.CanvasObjectSchema = base_1.BaseSchema.extend({
    type: zod_1.z.enum(["part", "assembly", "stand", "mesh"]), // "mesh" is allowed here if they drop a raw mesh
    baseEntityId: zod_1.z.string().uuid(), // ID pointing to the Master Catalog (e.g. partId, assemblyId)
    name: zod_1.z.string(), // Custom name for the instance
    position: Vector3Schema.default([0, 0, 0]),
    rotation: Vector3Schema.default([0, 0, 0]),
    scale: Vector3Schema.default([1, 1, 1]),
    order: zod_1.z.number().int().default(0), // Mounting order
    // Key-Value map where key is the original meshId inside the Part, and value is the override
    meshOverrides: zod_1.z.record(zod_1.z.string().uuid(), exports.MeshOverrideSchema).optional(),
});
/**
 * Main Canvas Document (Container Header)
 * It no longer holds the nodes array. Items are stored in the "objects" sub-collection.
 */
exports.CanvasSchema = base_1.BaseSchema.extend({
    name: zod_1.z.string().min(1, "Unnamed"),
    type: zod_1.z.enum(exports.CANVAS_TYPES),
});
exports.CanvasCreateSchema = exports.CanvasSchema.omit({
    id: true,
    orgId: true,
    ownId: true,
    users: true,
    updates: true,
    version: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
    deletedAt: true,
    deletedBy: true,
    isArchived: true,
    endLifeTime: true,
    active: true,
    meta: true
});
//# sourceMappingURL=canvas.js.map