"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarSlotPolicyMatrix = exports.CalendarSlotSearchSchema = exports.CalendarSlotUpdateSchema = exports.CalendarSlotCreateSchema = exports.CalendarSlotSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
exports.CalendarSlotSchema = base_1.BaseSchema.extend({
    resourceType: zod_1.z.enum(['user', 'product', 'tool']),
    resourceId: zod_1.z.string(),
    startDate: zod_1.z.string().datetime(), // ISO 8601 string or similar
    endDate: zod_1.z.string().datetime(),
    referenceType: zod_1.z.enum(['task', 'rent', 'availability']),
    referenceId: zod_1.z.string().optional(),
    warehouseId: zod_1.z.string(), // Crucial for location-based scheduling
    quantity: zod_1.z.number().default(1)
});
exports.CalendarSlotCreateSchema = (0, base_1.createCreationSchema)(exports.CalendarSlotSchema);
exports.CalendarSlotUpdateSchema = (0, base_1.createUpdateSchema)(exports.CalendarSlotSchema);
exports.CalendarSlotSearchSchema = base_1.PaginationQuerySchema.extend({
    resourceType: zod_1.z.enum(['user', 'product', 'tool']).optional(),
    resourceId: zod_1.z.string().optional(),
    warehouseId: zod_1.z.string().optional(),
    referenceType: zod_1.z.enum(['task', 'rent', 'availability']).optional()
});
exports.CalendarSlotPolicyMatrix = {
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
//# sourceMappingURL=calendar.js.map