import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";
export const TaskSchema = BaseSchema.extend({
    name: z.string(),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'done', 'blocked']).default('todo'),
    processId: z.string().optional(), // Reference to the Process
    assignedTo: z.string().optional(), // userId
    warehouseId: z.string() // Location where task is performed
});
export type Task = z.infer<typeof TaskSchema>;
export const TaskCreateSchema = createCreationSchema(TaskSchema);
export const TaskUpdateSchema = createUpdateSchema(TaskSchema);
export const TaskSearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'done', 'blocked']).optional(),
    assignedTo: z.string().optional(),
    warehouseId: z.string().optional()
});
export const TaskPolicyMatrix: Record<RoleId, EntityPolicy> = {
    guest: {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        fieldPermissions: {}
    },
    pending: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    engineer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
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
    dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
