"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessPolicyMatrix = exports.ProcessSearchSchema = exports.ProcessUpdateSchema = exports.ProcessCreateSchema = exports.ProcessSchema = exports.ProcessRoleSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
const primitives_1 = require("./primitives");
exports.ProcessRoleSchema = zod_1.z.enum(primitives_1.SystemRoleOptions.map(o => o.value));
exports.ProcessSchema = base_1.BaseSchema.extend({
    name: zod_1.z.string(),
    phase: zod_1.z.enum(['CLIENT IN', 'DESIGN/ENG', 'CLIENT APP.', 'FABRICATION', 'WAREHOUSE', 'LOGISTICS', 'ON-SITE', 'STRIKE', 'RECOVERY', 'CLOSING']).optional(),
    description: zod_1.z.string().optional(),
    requiredRole: exports.ProcessRoleSchema.optional(), // Skill Matching & Security
    timeMatrix: zod_1.z.array(zod_1.z.object({
        quantityThreshold: zod_1.z.number(), // e.g. up to 1, up to 10
        setupTimeMinutes: zod_1.z.number(), // Prep time
        executionTimeMinutes: zod_1.z.number(), // Execution time per unit
        cleanupTimeMinutes: zod_1.z.number() // Cleanup time
    })).default([]),
    cost: zod_1.z.number().optional().describe("Internal standard cost (e.g. per hr)"),
    price: zod_1.z.number().optional().describe("External standard price (e.g. per hr)"),
});
exports.ProcessCreateSchema = (0, base_1.createCreationSchema)(exports.ProcessSchema);
exports.ProcessUpdateSchema = (0, base_1.createUpdateSchema)(exports.ProcessSchema);
exports.ProcessSearchSchema = base_1.PaginationQuerySchema.extend({
    name: zod_1.z.string().optional(),
    requiredRole: exports.ProcessRoleSchema.optional(),
});
exports.ProcessPolicyMatrix = {
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
//# sourceMappingURL=process.js.map