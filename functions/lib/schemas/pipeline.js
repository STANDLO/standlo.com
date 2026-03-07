"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelinePolicyMatrix = exports.PipelineExecutionSchema = exports.PipelineCustomerSchema = exports.PipelineManagerSchema = exports.PipelineAdminSchema = exports.PipelineSchema = exports.PipelineEdgeSchema = exports.PipelineNodeSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
/**
 * Node Schema (Represents a single block in the React Flow canvas)
 */
exports.PipelineNodeSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    type: zod_1.z.union([
        zod_1.z.literal("trigger"),
        zod_1.z.literal("action"),
        zod_1.z.literal("logic"),
        zod_1.z.literal("brain"),
        zod_1.z.literal("custom")
    ]),
    position: zod_1.z.object({
        x: zod_1.z.number(),
        y: zod_1.z.number()
    }),
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(), // Holds the specific configuration of the node (e.g. prompt, collectionName)
    width: zod_1.z.number().optional(),
    height: zod_1.z.number().optional()
});
/**
 * Edge Schema (Represents a connection between two nodes)
 */
exports.PipelineEdgeSchema = zod_1.z.object({
    id: zod_1.z.string().min(1),
    source: zod_1.z.string().min(1),
    target: zod_1.z.string().min(1),
    sourceHandle: zod_1.z.string().optional().nullable(),
    targetHandle: zod_1.z.string().optional().nullable(),
    type: zod_1.z.string().optional(),
    animated: zod_1.z.boolean().optional(),
    label: zod_1.z.string().optional()
});
/**
 * The Master Pipeline Schema
 */
exports.PipelineSchema = base_1.BaseSchema.extend({
    name: zod_1.z.string().min(1, "Name is required"),
    description: zod_1.z.string().optional(),
    nodes: zod_1.z.array(exports.PipelineNodeSchema).default([]),
    edges: zod_1.z.array(exports.PipelineEdgeSchema).default([]),
    isActive: zod_1.z.boolean().default(false)
});
// Roles schemas (using the Master Schema layout strategy)
exports.PipelineAdminSchema = exports.PipelineSchema;
exports.PipelineManagerSchema = exports.PipelineSchema.omit({});
exports.PipelineCustomerSchema = exports.PipelineSchema.pick({
    id: true,
    name: true,
    description: true
});
exports.PipelineExecutionSchema = base_1.BaseSchema.extend({
    pipelineId: zod_1.z.string().min(1),
    status: zod_1.z.union([zod_1.z.literal("success"), zod_1.z.literal("error"), zod_1.z.literal("running")]),
    startedAt: zod_1.z.string().optional(),
    completedAt: zod_1.z.string().optional(),
    triggeredBy: zod_1.z.string().optional(),
    log: zod_1.z.array(zod_1.z.any()).optional(),
    finalContext: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional()
});
exports.PipelinePolicyMatrix = {
    pending: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    standlo_design: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    architect: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    engineer: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    designer: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    electrician: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plumber: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    carpenter: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    cabinetmaker: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    dryliner: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
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
//# sourceMappingURL=pipeline.js.map