import { DbSchema } from "./db";
import { z } from "zod";
/**
 * Node Schema (Represents a single block in the React Flow design)
 */
export const PipelineNodeSchema = z.object({
    id: z.string().min(1),
    type: z.union([
        z.literal("trigger"),
        z.literal("action"),
        z.literal("logic"),
        z.literal("brain"),
        z.literal("custom")
    ]),
    position: z.object({
        x: z.number(),
        y: z.number()
    }),
    data: z.record(z.string(), z.unknown()).optional(), // Holds the specific configuration of the node (e.g. prompt, collectionName)
    width: z.number().optional(),
    height: z.number().optional()
});
/**
 * Edge Schema (Represents a connection between two nodes)
 */
export const PipelineEdgeSchema = z.object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    sourceHandle: z.string().optional().nullable(),
    targetHandle: z.string().optional().nullable(),
    type: z.string().optional(),
    animated: z.boolean().optional(),
    label: z.string().optional()
});
/**
 * The Master Pipeline Schema
 */
export const PipelineSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    nodes: z.array(PipelineNodeSchema).default([]),
    edges: z.array(PipelineEdgeSchema).default([]),
    isActive: z.boolean().default(false)
});
// Roles schemas (using the Master Schema layout strategy)
export const PipelineAdminSchema = PipelineSchema;
export const PipelineManagerSchema = PipelineSchema.omit({});
export const PipelineCustomerSchema = PipelineSchema.pick({
    name: true,
    description: true
});
export type PipelineEntity = z.infer<typeof PipelineSchema>;
export type PipelineNodeEntity = z.infer<typeof PipelineNodeSchema>;
export type PipelineEdgeEntity = z.infer<typeof PipelineEdgeSchema>;
export const PipelineExecutionSchema = z.object({
    pipelineId: z.string().min(1),
    status: z.union([z.literal("success"), z.literal("error"), z.literal("running")]),
    startedAt: z.string().optional(),
    completedAt: z.string().optional(),
    triggeredBy: z.string().optional(),
    log: z.array(z.any()).optional(),
    finalContext: z.record(z.string(), z.any()).optional()
});
export type PipelineExecutionEntity = z.infer<typeof PipelineExecutionSchema>;
import { RoleId } from "./auth";

export const PipelineNodeDbSchema = DbSchema.merge(PipelineNodeSchema);
export type PipelineNodeDbEntity = z.infer<typeof PipelineNodeDbSchema>;

export const PipelineDbSchema = DbSchema.merge(PipelineSchema);
export type PipelineDbEntity = z.infer<typeof PipelineDbSchema>;
