import { z } from "zod";
import { BaseSchema } from "./base";
/**
 * Node Schema (Represents a single block in the React Flow canvas)
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
export const PipelineSchema = BaseSchema.extend({
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
    id: true,
    name: true,
    description: true
});
export type PipelineEntity = z.infer<typeof PipelineSchema>;
export type PipelineNodeEntity = z.infer<typeof PipelineNodeSchema>;
export type PipelineEdgeEntity = z.infer<typeof PipelineEdgeSchema>;
export const PipelineExecutionSchema = BaseSchema.extend({
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
import { EntityPolicy } from "../rbac/core";
export const PipelinePolicyMatrix: Record<RoleId, EntityPolicy> = {
    pending: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    architect: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    engineer: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    designer: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    electrician: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plumber: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    carpenter: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    cabinetmaker: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    dryliner: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    ironworker: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    windowfitter: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    glazier: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    riggers: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standbuilder: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plasterer: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    painter: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    tiler: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    driver: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    forkliftdriver: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    promoter: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    other: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
