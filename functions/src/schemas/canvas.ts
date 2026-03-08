import { z } from "zod";
import { BaseSchema } from "./base";
export const CANVAS_TYPES = ["part", "assembly", "stand"] as const;
/**
 * Zod Schema for Vector3 values (position, rotation, scale)
 */
const Vector3Schema = z.tuple([z.number(), z.number(), z.number()]);
/**
 * Override properties for a specific Mesh within an Instance
 */
export const MeshOverrideSchema = z.object({
    textureId: z.string().nullable().optional(),
    materialId: z.string().nullable().optional(),
    color: z.string().nullable().optional(),
});
/**
 * Instance of a Catalog Entity placed in a Canvas
 * This replaces CanvasNode and represents an actual Object3D in the scene
 */
export const CanvasObjectSchema = BaseSchema.extend({
    type: z.enum(["part", "assembly", "stand", "mesh"]), // "mesh" is allowed here if they drop a raw mesh
    baseEntityId: z.string().uuid(), // ID pointing to the Master Catalog (e.g. partId, assemblyId)
    name: z.string(), // Custom name for the instance
    position: Vector3Schema.default([0, 0, 0]),
    rotation: Vector3Schema.default([0, 0, 0]),
    scale: Vector3Schema.default([1, 1, 1]),
    order: z.number().int().default(0), // Mounting order
    // Key-Value map where key is the original meshId inside the Part, and value is the override
    meshOverrides: z.record(z.string().uuid(), MeshOverrideSchema).optional(),
});
export type CanvasObject = z.infer<typeof CanvasObjectSchema>;
export type MeshOverride = z.infer<typeof MeshOverrideSchema>;
/**
 * Main Canvas Document (Container Header)
 * It no longer holds the nodes array. Items are stored in the "objects" sub-collection.
 */
export const CanvasSchema = BaseSchema.extend({
    name: z.string().min(1, "Unnamed"),
    type: z.enum(CANVAS_TYPES),
});
export type CanvasType = z.infer<typeof CanvasSchema>;
export const CanvasCreateSchema = CanvasSchema.omit({
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
export type CanvasCreate = z.infer<typeof CanvasCreateSchema>;
