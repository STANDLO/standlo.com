"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallPolicyMatrix = exports.CallSearchSchema = exports.CallUpdateSchema = exports.CallCreateSchema = exports.CallSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
exports.CallSchema = base_1.BaseSchema.extend({
    apiKeyHint: zod_1.z.string().describe("text"), // The hint or ref of the API key used
    status: zod_1.z.number().int().describe("number"), // HTTP status code (200, 404, 500)
    method: zod_1.z.string().optional().describe("text"), // HTTP method (GET, POST, etc.)
    durationMs: zod_1.z.number().int().optional().describe("number"), // Execution time in ms
    // The 'code' field inherited from BaseSchema will be used to store the called endpoint.
});
exports.CallCreateSchema = (0, base_1.createCreationSchema)(exports.CallSchema);
exports.CallUpdateSchema = (0, base_1.createUpdateSchema)(exports.CallSchema);
exports.CallSearchSchema = base_1.PaginationQuerySchema.extend({
    name: zod_1.z.string().optional()
});
exports.CallPolicyMatrix = {
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
};
//# sourceMappingURL=call.js.map