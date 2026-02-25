import { z } from "zod";
import { BaseSchema } from "./base";

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

/*
* Role Schema
*/
export const RoleSchema = BaseSchema.extend({});
export type Role = z.infer<typeof RoleSchema>;
