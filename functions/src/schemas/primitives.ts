import { z } from "zod";

/**
 * 0. System Roles
 * Ruoli di sistema centralizzati per strongly typing
 */
export const SystemRoles = [
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
] as const;

export const RoleIdSchema = z.enum(SystemRoles);
export type RoleId = z.infer<typeof RoleIdSchema>;

export const SystemRoleLabels: Record<RoleId, string> = {
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

export const SystemRoleOptions = SystemRoles
    .filter(role => role !== 'pending' && role !== 'other') // Escludiamo ruoli interni
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
