"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandPolicyMatrix = exports.StandSearchSchema = exports.StandUpdateSchema = exports.StandCreateSchema = exports.StandProcessNodeSchema = exports.StandPartNodeSchema = exports.StandBundleNodeSchema = exports.StandAssemblyNodeSchema = exports.StandSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
exports.StandSchema = base_1.BaseSchema.extend({
    // Financial properties
    cost: zod_1.z.number().optional().describe("Internal standard cost"),
    price: zod_1.z.number().optional().describe("External standard price"),
});
// --- SUBCOLLECTION SCHEMAS ---
exports.StandAssemblyNodeSchema = base_1.BaseNodeSchema.extend({
    assemblyId: zod_1.z.string()
});
exports.StandBundleNodeSchema = base_1.BaseNodeSchema.extend({
    bundleId: zod_1.z.string()
});
exports.StandPartNodeSchema = base_1.BaseNodeSchema.extend({
    partId: zod_1.z.string()
});
exports.StandProcessNodeSchema = base_1.BaseProcessSchema.extend({});
exports.StandCreateSchema = (0, base_1.createCreationSchema)(exports.StandSchema);
exports.StandUpdateSchema = (0, base_1.createUpdateSchema)(exports.StandSchema);
exports.StandSearchSchema = base_1.PaginationQuerySchema.extend({
    name: zod_1.z.string().optional(),
});
exports.StandPolicyMatrix = {
    pending: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
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
//# sourceMappingURL=stand.js.map