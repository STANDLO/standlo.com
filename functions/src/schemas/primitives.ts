import { z } from "zod";
/**
 * 0. System Roles
 * Ruoli di sistema centralizzati per strongly typing
 */
export const SystemRoles = [
    // SYSTEM
    'guest',
    'pending',
    'other',
    // STANDLO
    'standlo_manager',
    'standlo_architect',
    'standlo_engeneer',
    'standlo_designer',
    // USERS
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
    'promoter'
] as const;
export const RoleIdSchema = z.enum(SystemRoles);
export type RoleId = z.infer<typeof RoleIdSchema>;
export const SystemRoleLabels: Record<RoleId, string> = {
    // STANDLO
    standlo_manager: 'Manager @ STANDLO',
    standlo_architect: 'Architect @ STANDLO',
    standlo_engeneer: 'Engeneer @ STANDLO',
    standlo_designer: 'Designer @ STANDLO',
    // SYSTEM
    guest: 'Guest',
    pending: 'Pending',
    other: 'Other',
    // USERS
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
    promoter: 'Promoter'
};
export const SystemRoleOptions = SystemRoles
    .filter(role =>
        role !== 'pending' &&
        role !== 'other' &&
        !role.startsWith('standlo_')
    ) // Escludiamo ruoli interni e di standlo
    .map(role => ({
        value: role,
        label: SystemRoleLabels[role]
    }));
/**
 * 1. Localized String Schema
 * Schema per i campi testuali multi-lingua.
 * L'italiano ("it") è considerato la lingua principale ed è obbligatorio.
 * "en" e "es" sono opzionali.
 */
export const LocalizedStringSchema = z.object({
    it: z.string().optional(),
    es: z.string().optional()
});
