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
