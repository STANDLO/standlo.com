import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const AssemblySchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    locationType: z.enum(['warehouse', 'site']).default('warehouse'),
    // Financial properties
    cost: z.number().optional().describe("Internal standard cost"),
    price: z.number().optional().describe("External standard price"),
    gltfUrl: z.string().optional().describe("URL to a pre-baked .glb representation of this assembly (optional)"),
    useCases: z.array(z.object({
        designType: z.string(),
        designLayer: z.string()
    })).default([]),
    sockets: z.array(z.object({
        id: z.string(),
        type: z.enum(['male', 'female', 'neutral']),
        position: z.tuple([z.number(), z.number(), z.number()]).describe("[x, y, z] coordinates relative to assembly center"),
        rotation: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional().describe("Quaternion [x, y, z, w] for socket orientation")
    })).default([]),

    // Spatial properties for handling instances
    dimension: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
});
export type Assembly = z.infer<typeof AssemblySchema>;
// --- SUBCOLLECTION SCHEMAS ---
// Note: In V2, 3D composition is handled dynamically by ObjectSchema subcollections.

export const AssemblyDbSchema = DbSchema.merge(AssemblySchema);
export type AssemblyDbEntity = z.infer<typeof AssemblyDbSchema>;
