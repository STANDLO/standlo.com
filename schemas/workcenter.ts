import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const WorkcenterSchema = z.object({
    warehouseId: z.string(),
    name: z.string(), // e.g. 'Cabina Verniciatura'
    description: z.string().optional()
});
export type Workcenter = z.infer<typeof WorkcenterSchema>;
export const WorkcenterDbSchema = DbSchema.merge(WorkcenterSchema);
export type WorkcenterDbEntity = z.infer<typeof WorkcenterDbSchema>;
