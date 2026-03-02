import { z } from "zod";
import { BaseSchema } from "./base";

/**
 * Canvas Texture Document
 * Holds visual data (images or hex colors) supporting Light and Dark modes
 */
export const CanvasTextureSchema = BaseSchema.extend({
    name: z.string().min(1, "Name is required"),
    type: z.enum(["color", "imageMap", "normalMap", "roughnessMap"]),

    // Multi-Theme Support
    // Can be a Hex color (#ffffff) or a URL to an image asset
    valueLight: z.string(),
    valueDark: z.string().optional(), // Falls back to valueLight if not provided
});

export type CanvasTexture = z.infer<typeof CanvasTextureSchema>;

/**
 * Canvas Material Document
 * Defines physical properties for PBR rendering in Three.js
 */
export const CanvasMaterialSchema = BaseSchema.extend({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),

    // Map references (links to CanvasTextureSchema documents)
    mapId: z.string().optional(), // Main diffuse/color map
    normalMapId: z.string().optional(),
    roughnessMapId: z.string().optional(),

    // Physical properties
    roughness: z.number().min(0).max(1).default(0.5),
    metalness: z.number().min(0).max(1).default(0),
    opacity: z.number().min(0).max(1).default(1),
    transparent: z.boolean().default(false),
});

export type CanvasMaterial = z.infer<typeof CanvasMaterialSchema>;
