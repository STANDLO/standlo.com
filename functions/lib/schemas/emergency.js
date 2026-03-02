"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyPolicyMatrix = exports.EmergencySearchSchema = exports.EmergencyUpdateSchema = exports.EmergencyCreateSchema = exports.EmergencyToolNodeSchema = exports.EmergencyProcessNodeSchema = exports.EmergencyPartNodeSchema = exports.EmergencyAssemblyNodeSchema = exports.EmergencyCanvasNodeSchema = exports.EmergencySchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
exports.EmergencySchema = base_1.BaseSchema.extend({
    name: zod_1.z.string().describe("Incident or emergency intervention name"),
    description: zod_1.z.string().optional(),
    severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    location: zod_1.z.string().optional(),
});
// --- SUBCOLLECTION SCHEMAS ---
exports.EmergencyCanvasNodeSchema = zod_1.z.object({
    entityId: zod_1.z.string().describe("Can be a Part ID or an Assembly ID"),
    entityType: zod_1.z.enum(['part', 'assembly']),
    position: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number()]),
    rotation: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number(), zod_1.z.number(), zod_1.z.number()])
});
exports.EmergencyAssemblyNodeSchema = zod_1.z.object({
    assemblyId: zod_1.z.string(),
    quantity: zod_1.z.number()
});
exports.EmergencyPartNodeSchema = zod_1.z.object({
    partId: zod_1.z.string(),
    quantity: zod_1.z.number()
});
exports.EmergencyProcessNodeSchema = zod_1.z.object({
    processId: zod_1.z.string(),
    quantity: zod_1.z.number()
});
exports.EmergencyToolNodeSchema = zod_1.z.object({
    toolId: zod_1.z.string(),
    quantity: zod_1.z.number()
});
exports.EmergencyCreateSchema = (0, base_1.createCreationSchema)(exports.EmergencySchema);
exports.EmergencyUpdateSchema = (0, base_1.createUpdateSchema)(exports.EmergencySchema);
exports.EmergencySearchSchema = base_1.PaginationQuerySchema.extend({
    name: zod_1.z.string().optional(),
    severity: zod_1.z.enum(['low', 'medium', 'high', 'critical']).optional(),
});
exports.EmergencyPolicyMatrix = {
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
//# sourceMappingURL=emergency.js.map