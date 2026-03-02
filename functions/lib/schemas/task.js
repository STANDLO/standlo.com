"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskPolicyMatrix = exports.TaskSearchSchema = exports.TaskUpdateSchema = exports.TaskCreateSchema = exports.TaskSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
exports.TaskSchema = base_1.BaseSchema.extend({
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    status: zod_1.z.enum(['todo', 'in_progress', 'done', 'blocked']).default('todo'),
    processId: zod_1.z.string().optional(), // Reference to the Process
    assignedTo: zod_1.z.string().optional(), // userId
    warehouseId: zod_1.z.string() // Location where task is performed
});
exports.TaskCreateSchema = (0, base_1.createCreationSchema)(exports.TaskSchema);
exports.TaskUpdateSchema = (0, base_1.createUpdateSchema)(exports.TaskSchema);
exports.TaskSearchSchema = base_1.PaginationQuerySchema.extend({
    name: zod_1.z.string().optional(),
    status: zod_1.z.enum(['todo', 'in_progress', 'done', 'blocked']).optional(),
    assignedTo: zod_1.z.string().optional(),
    warehouseId: zod_1.z.string().optional()
});
exports.TaskPolicyMatrix = {
    pending: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    standlo_design: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
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
    dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
//# sourceMappingURL=task.js.map