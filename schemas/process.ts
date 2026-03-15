import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
import rolesJson from "./roles.json";
export const ProcessRoleSchema = z.enum(
    rolesJson.map(o => o.id) as [string, ...string[]]
);
export const ProcessSchema = z.object({
    name: z.string(),
    phase: z.enum(['CLIENT IN', 'DESIGN/ENG', 'CLIENT APP.', 'FABRICATION', 'WAREHOUSE', 'LOGISTICS', 'ON-SITE', 'STRIKE', 'RECOVERY', 'CLOSING']).optional(),
    description: z.string().optional(),
    requiredRole: ProcessRoleSchema.optional(), // Skill Matching & Security
    timeMatrix: z.array(z.object({
        quantityThreshold: z.number(), // e.g. up to 1, up to 10
        setupTimeMinutes: z.number(), // Prep time
        executionTimeMinutes: z.number(), // Execution time per unit
        cleanupTimeMinutes: z.number() // Cleanup time
    })).default([]),
    cost: z.number().optional().describe("Internal standard cost (e.g. per hr)"),
    price: z.number().optional().describe("External standard price (e.g. per hr)"),
});
export type Process = z.infer<typeof ProcessSchema>;
export const ProcessDbSchema = DbSchema.merge(ProcessSchema);
export type ProcessDbEntity = z.infer<typeof ProcessDbSchema>;
