import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const WarehouseTypes = ['materials', 'customer'] as const;
export const WarehouseSchema = z.object({
    type: z.enum(WarehouseTypes).default('materials'),
    placeId: z.string().optional().describe(JSON.stringify({ type: "relation", relation: "place", label: "Place ID" })),
    // The 'code' field (e.g. "IT-20017-IT03133760128") will be generated via pipeline.
    // BaseSchema's 'name' property is now the optional fallback, no longer strictly required.
});
export type Warehouse = z.infer<typeof WarehouseSchema>;
export const WarehouseDbSchema = DbSchema.merge(WarehouseSchema);
export type WarehouseDbEntity = z.infer<typeof WarehouseDbSchema>;
