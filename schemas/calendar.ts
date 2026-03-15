import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const CalendarSlotSchema = z.object({
    resourceType: z.enum(['user', 'product', 'tool']),
    resourceId: z.string(),
    startDate: z.string().datetime(), // ISO 8601 string or similar
    endDate: z.string().datetime(),
    referenceType: z.enum(['task', 'rent', 'availability']),
    referenceId: z.string().optional(),
    warehouseId: z.string(), // Crucial for location-based scheduling
    quantity: z.number().default(1)
});
export type CalendarSlot = z.infer<typeof CalendarSlotSchema>;
export const CalendarSlotDbSchema = DbSchema.merge(CalendarSlotSchema);
export type CalendarSlotDbEntity = z.infer<typeof CalendarSlotDbSchema>;
