"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalizedStringSchema = exports.SystemRoleOptions = exports.SystemRoleLabels = exports.RoleIdSchema = exports.SystemRoles = void 0;
const zod_1 = require("zod");
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
    'dryliner',
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
exports.SystemRoleLabels = {
    pending: 'Pending',
    customer: 'Customer',
    provider: 'Material Provider',
    manager: 'Project Manager',
    architect: 'Architect',
    engineer: 'Engineer',
    designer: 'Designer',
    electrician: 'Electrician',
    plumber: 'Plumber',
    carpenter: 'Carpenter',
    cabinetmaker: 'Cabinetmaker',
    dryliner: 'Dryliner',
    ironworker: 'Ironworker',
    windowfitter: 'Window Fitter',
    glazier: 'Glazier',
    riggers: 'Riggers',
    standbuilder: 'Stand Builder',
    plasterer: 'Plasterer',
    painter: 'Painter',
    tiler: 'Tiler',
    driver: 'Driver',
    forkliftdriver: 'Forklift Driver',
    promoter: 'Promoter',
    other: 'Other'
};
exports.SystemRoleOptions = exports.SystemRoles
    .filter(role => role !== 'pending' && role !== 'other') // Escludiamo ruoli interni
    .map(role => ({
    value: role,
    label: exports.SystemRoleLabels[role]
}));
/**
 * 1. Localized String Schema
 * Schema per i campi testuali multi-lingua.
 * L'italiano ("it") è considerato la lingua principale ed è obbligatorio.
 * "en" e "es" sono opzionali.
 */
exports.LocalizedStringSchema = zod_1.z.object({
    it: zod_1.z.string().optional(),
    es: zod_1.z.string().optional()
});
//# sourceMappingURL=primitives.js.map