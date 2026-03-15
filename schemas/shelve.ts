import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const ShelveSchema = z.object({
    warehouseId: z.string(),
    name: z.string(), // e.g. 'Scaffale 13B'
    conditionRanking: z.enum(['A', 'B', 'C']).optional(), // Usura / Grade
    products: z.array(z.object({
        productId: z.string(),
        quantity: z.number()
    })).default([]) // Stock locale nello scaffale
});
export type Shelve = z.infer<typeof ShelveSchema>;
export const ShelveDbSchema = DbSchema.merge(ShelveSchema);
export type ShelveDbEntity = z.infer<typeof ShelveDbSchema>;
