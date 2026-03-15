import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const ToolSchema = z.object({
    cost: z.number().optional().describe("Internal standard cost"),
    price: z.number().optional().describe("External standard price"),
});
export type Tool = z.infer<typeof ToolSchema>;
export const ToolDbSchema = DbSchema.merge(ToolSchema);
export type ToolDbEntity = z.infer<typeof ToolDbSchema>;
