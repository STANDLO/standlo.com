"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthEventSchema = exports.RoleSchema = exports.RoleIdSchema = exports.SystemRoles = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
const primitives_1 = require("./primitives");
Object.defineProperty(exports, "SystemRoles", { enumerable: true, get: function () { return primitives_1.SystemRoles; } });
Object.defineProperty(exports, "RoleIdSchema", { enumerable: true, get: function () { return primitives_1.RoleIdSchema; } });
/*
* Role Schema
*/
exports.RoleSchema = base_1.BaseSchema.extend({});
/*
* Auth Event Schema (Event Sourcing)
*/
exports.AuthEventSchema = base_1.BaseSchema.extend({
    type: zod_1.z.enum([
        "create",
        "verify",
        "onboarding",
        "login",
        "logout",
        "session_refresh",
        "delete"
    ]),
    uid: zod_1.z.string(),
    email: zod_1.z.string().email().optional(),
    // Enriched Fields
    sessionId: zod_1.z.string().uuid().optional(),
    ipAddress: zod_1.z.string().optional(),
    userAgent: zod_1.z.string().optional()
});
//# sourceMappingURL=auth.js.map