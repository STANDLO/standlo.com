import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const MeshOverrideSchema = z.object({
    meshId: z.string(),
    materialId: z.string().optional(),
    textureId: z.string().optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/i).optional(), 
    visible: z.boolean().default(true),
    opacity: z.number().min(0).max(1).default(1)
});

export const DesignObjectSchema = z.object({
    id: z.string(), 
    type: z.string(), 
    baseEntityId: z.string(), 
    name: z.string(), 
    layerId: z.string().default("strutture"), 
    position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    order: z.number().int().default(0), 
    meshOverrides: z.record(z.string(), MeshOverrideSchema).optional(),
});

export type DesignObject = z.infer<typeof DesignObjectSchema>;
export type MeshOverride = z.infer<typeof MeshOverrideSchema>;

export const DesignSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(["stand", "bedroom", "bathroom", "kitchen", "office"]).default("stand"),
    // Financial properties
    cost: z.number().optional().describe("Internal standard cost"),
    price: z.number().optional().describe("External standard price"),

    // Spatial properties for handling instances
    dimension: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
});
export type Design = z.infer<typeof DesignSchema>;
// --- SUBCOLLECTION SCHEMAS ---
// Note: V2 spatial relationships are natively driven by the /objects/* wildcard structure via ObjectSchema.

export const MeshOverrideDbSchema = DbSchema.merge(MeshOverrideSchema);
export type MeshOverrideDbEntity = z.infer<typeof MeshOverrideDbSchema>;
