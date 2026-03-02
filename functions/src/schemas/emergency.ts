import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";

export const EmergencySchema = BaseSchema.extend({
    name: z.string().describe("Incident or emergency intervention name"),
    description: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    location: z.string().optional(),
});
export type Emergency = z.infer<typeof EmergencySchema>;

// --- SUBCOLLECTION SCHEMAS ---
export const EmergencyCanvasNodeSchema = z.object({
    entityId: z.string().describe("Can be a Part ID or an Assembly ID"),
    entityType: z.enum(['part', 'assembly']),
    position: z.tuple([z.number(), z.number(), z.number()]),
    rotation: z.tuple([z.number(), z.number(), z.number(), z.number()])
});
export type EmergencyCanvasNode = z.infer<typeof EmergencyCanvasNodeSchema>;

export const EmergencyAssemblyNodeSchema = z.object({
    assemblyId: z.string(),
    quantity: z.number()
});
export type EmergencyAssemblyNode = z.infer<typeof EmergencyAssemblyNodeSchema>;

export const EmergencyPartNodeSchema = z.object({
    partId: z.string(),
    quantity: z.number()
});
export type EmergencyPartNode = z.infer<typeof EmergencyPartNodeSchema>;

export const EmergencyProcessNodeSchema = z.object({
    processId: z.string(),
    quantity: z.number()
});
export type EmergencyProcessNode = z.infer<typeof EmergencyProcessNodeSchema>;

export const EmergencyToolNodeSchema = z.object({
    toolId: z.string(),
    quantity: z.number()
});
export type EmergencyToolNode = z.infer<typeof EmergencyToolNodeSchema>;


export const EmergencyCreateSchema = createCreationSchema(EmergencySchema);
export const EmergencyUpdateSchema = createUpdateSchema(EmergencySchema);
export const EmergencySearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export const EmergencyPolicyMatrix: Record<RoleId, EntityPolicy> = {
    pending: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    architect: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    engineer: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    designer: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    standlo_design: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    electrician: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plumber: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    carpenter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    cabinetmaker: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    ironworker: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    windowfitter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    glazier: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    riggers: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standbuilder: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plasterer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    painter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    tiler: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    driver: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    forkliftdriver: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    promoter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    other: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
