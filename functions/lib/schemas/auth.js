"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleSchema = exports.RoleIdSchema = exports.SystemRoles = void 0;
const base_1 = require("./base");
const primitives_1 = require("./primitives");
Object.defineProperty(exports, "SystemRoles", { enumerable: true, get: function () { return primitives_1.SystemRoles; } });
Object.defineProperty(exports, "RoleIdSchema", { enumerable: true, get: function () { return primitives_1.RoleIdSchema; } });
/*
* Role Schema
*/
exports.RoleSchema = base_1.BaseSchema.extend({});
//# sourceMappingURL=auth.js.map