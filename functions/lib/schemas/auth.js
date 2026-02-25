"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleSchema = exports.RoleIdSchema = exports.SystemRoles = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
/**
 * 0. System Roles
 * Ruoli di sistema centralizzati per strongly typing
 */
exports.SystemRoles = [
    'pending',
    'customer',
    'provider',
    'manager',
    'architect',
    'engineer',
    'designer',
    'electrician',
    'plumber',
    'carpenter',
    'cabinetmaker',
    'ironworker',
    'windowfitter',
    'glazier',
    'riggers',
    'standbuilder',
    'plasterer',
    'painter',
    'tiler',
    'driver',
    'forkliftdriver',
    'promoter',
    'other'
];
exports.RoleIdSchema = zod_1.z.enum(exports.SystemRoles);
/*
* Role Schema
*/
exports.RoleSchema = base_1.BaseSchema.extend({});
//# sourceMappingURL=auth.js.map