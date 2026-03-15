import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const PART_CATEGORIES_BY_SECTOR: Record<string, Record<string, string>> = {
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
export const PartSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    sector: z.string(), // e.g. construction, exhibition
    category: z.string(), // e.g. Wood Panel, Fasteners, Cables
    isRentable: z.boolean().default(true),
    isSellable: z.boolean().default(true),
    isConsumable: z.boolean().default(false), // Consumables vs Assets
    baseUnit: z.string().default('pcs'), // 'pcs', 'sqm', 'lm'
    // Spatial properties for handling instances
    dimension: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    // Financial properties
    cost: z.number().optional().describe("Internal standard cost"),
    price: z.number().optional().describe("External standard price"),

    gltfUrl: z.string().optional().describe("URL to the Draco-compressed .glb file stored in Firebase Storage"),
    useCases: z.array(z.object({
        designType: z.string(),
        designLayer: z.string()
    })).default([]),
    sockets: z.array(z.object({
        id: z.string(),
        type: z.enum(['male', 'female', 'neutral']),
        position: z.tuple([z.number(), z.number(), z.number()]).describe("[x, y, z] coordinates relative to part center"),
        rotation: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional().describe("Quaternion [x, y, z, w] for socket orientation")
    })).default([]),
});
export type Part = z.infer<typeof PartSchema>;
// --- SUBCOLLECTION SCHEMAS ---
export const PartProcessNodeSchema = z.object({
    id: z.string().uuid(),
    processId: z.string(),
    quantity: z.number()
});
export type PartProcessNode = z.infer<typeof PartProcessNodeSchema>;
export const PartToolNodeSchema = z.object({
    id: z.string().uuid(),
    toolId: z.string(),
    quantity: z.number()
});
export type PartToolNode = z.infer<typeof PartToolNodeSchema>;
export const PartDbSchema = DbSchema.merge(PartSchema);
export type PartDbEntity = z.infer<typeof PartDbSchema>;
