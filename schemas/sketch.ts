import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const SketchSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    width: z.number().optional().describe("Width in meters"),
    depth: z.number().optional().describe("Depth in meters"),
    height: z.number().optional().describe("Height in meters"),

    // Spatial properties for handling instances
    dimension: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
});

export type Sketch = z.infer<typeof SketchSchema>;

// --- API SCHEMAS ---

// --- RBAC POLICY MATRIX ---


export const SketchDbSchema = DbSchema.merge(SketchSchema);
export type SketchDbEntity = z.infer<typeof SketchDbSchema>;
