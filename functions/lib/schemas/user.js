"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPolicyMatrix = exports.UserSearchSchema = exports.UserUpdateSchema = exports.UserCreateSchema = exports.UserSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
exports.UserSchema = base_1.BaseSchema.extend({
    email: zod_1.z.string().email(),
    displayName: zod_1.z.string().nullable(),
    phoneNumber: zod_1.z.string().nullable(),
    claims: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
});
exports.UserCreateSchema = (0, base_1.createCreationSchema)(exports.UserSchema);
exports.UserUpdateSchema = (0, base_1.createUpdateSchema)(exports.UserSchema);
exports.UserSearchSchema = base_1.PaginationQuerySchema.extend({
    email: zod_1.z.string().optional(),
    roleId: zod_1.z.string().optional(),
});
// Default minimal policy for system-managed entities (To be expanded as needed)
const defaultPolicy = {
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    fieldPermissions: {}
};
exports.UserPolicyMatrix = {
    manager: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        fieldPermissions: {
            email: { read: true, write: true },
            displayName: { read: true, write: true },
            phoneNumber: { read: true, write: true },
        }
    },
    designer: defaultPolicy,
    standlo_design: defaultPolicy,
    pending: defaultPolicy,
    customer: defaultPolicy,
    provider: defaultPolicy,
    architect: defaultPolicy,
    engineer: defaultPolicy,
    electrician: defaultPolicy,
    plumber: defaultPolicy,
    carpenter: defaultPolicy,
    cabinetmaker: defaultPolicy,
    ironworker: defaultPolicy,
    windowfitter: defaultPolicy,
    glazier: defaultPolicy,
    riggers: defaultPolicy,
    standbuilder: defaultPolicy,
    plasterer: defaultPolicy,
    painter: defaultPolicy,
    tiler: defaultPolicy,
    driver: defaultPolicy,
    forkliftdriver: defaultPolicy,
    promoter: defaultPolicy,
    other: defaultPolicy,
    dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
//# sourceMappingURL=user.js.map