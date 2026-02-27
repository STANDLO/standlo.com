"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssemblyPolicyMatrix = exports.AssemblySearchSchema = exports.AssemblyUpdateSchema = exports.AssemblyCreateSchema = exports.AssemblySchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
const primitives_1 = require("./primitives");
exports.AssemblySchema = base_1.BaseSchema.extend({
    name: primitives_1.LocalizedStringSchema,
    description: primitives_1.LocalizedStringSchema.optional(),
    locationType: zod_1.z.enum(['warehouse', 'site']).default('warehouse'),
    parts: zod_1.z.array(zod_1.z.object({
        partId: zod_1.z.string(),
        quantity: zod_1.z.number()
    })).default([]),
    processes: zod_1.z.array(zod_1.z.object({
        processId: zod_1.z.string(),
        quantity: zod_1.z.number()
    })).default([]),
    tools: zod_1.z.array(zod_1.z.object({
        toolId: zod_1.z.string(),
        quantity: zod_1.z.number()
    })).default([])
});
exports.AssemblyCreateSchema = (0, base_1.createCreationSchema)(exports.AssemblySchema);
exports.AssemblyUpdateSchema = (0, base_1.createUpdateSchema)(exports.AssemblySchema);
exports.AssemblySearchSchema = base_1.PaginationQuerySchema.extend({
    name: zod_1.z.string().optional(),
    locationType: zod_1.z.enum(['warehouse', 'site']).optional(),
});
exports.AssemblyPolicyMatrix = {
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
    dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
//# sourceMappingURL=assembly.js.map