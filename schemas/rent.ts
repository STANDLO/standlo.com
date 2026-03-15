import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const RentSchema = z.object({
    name: z.string(), // e.g. "Noleggio Pannelli"
    productId: z.string(),
    quantity: z.number().min(1),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    status: z.enum(['active', 'returned', 'pending']).default('pending')
});
export type Rent = z.infer<typeof RentSchema>;
export const RentDbSchema = DbSchema.merge(RentSchema);
export type RentDbEntity = z.infer<typeof RentDbSchema>;
