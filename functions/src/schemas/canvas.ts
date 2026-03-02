import { z } from "zod";
import { BaseSchema } from "./base";

/**
 * Node within a Canvas hierarchy (e.g. a Mesh, a Light, a nested Assembly)
 */
export type CanvasNode = {
    id: string;
    type: "mesh" | "group" | "light" | "camera" | "assemblyRef";
    name: string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    geometryType?: "box" | "plane" | "cylinder" | "sphere" | "custom";
    geometryArgs?: number[];
    materialId?: string;
    faceMaterials?: Record<string, string>;
    children?: CanvasNode[];
};

export const CanvasNodeSchema: z.ZodType<CanvasNode> = z.lazy(() => z.object({
    id: z.string().uuid(),
    type: z.enum(["mesh", "group", "light", "camera", "assemblyRef"]),
    name: z.string(),
    position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    scale: z.tuple([z.number(), z.number(), z.number()]).default([1, 1, 1]),
    geometryType: z.enum(["box", "plane", "cylinder", "sphere", "custom"]).optional(),
    geometryArgs: z.array(z.number()).optional(),
    materialId: z.string().optional(),
    faceMaterials: z.record(z.string(), z.string()).optional(),
    children: z.array(CanvasNodeSchema).optional(),
}));

/**
 * Main Canvas Document (Part, Assembly, or Stand)
 */
export const CanvasSchema = BaseSchema.extend({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    type: z.enum(["part", "assembly", "stand"]),

    // Array of root nodes in the scene
    nodes: z.array(CanvasNodeSchema).default([]),

    // Link to the user who created/owns this canvas
    ownerId: z.string(),

    // (Optional) Links to commercial entities if this canvas is tied to a real-world object
    relatedProjectId: z.string().optional(),
    relatedStandId: z.string().optional(),
});

export type CanvasType = z.infer<typeof CanvasSchema>;
