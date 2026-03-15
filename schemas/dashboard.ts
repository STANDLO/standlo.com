import { z } from "zod";
import { DbSchema } from "./db";

export const DashboardSchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the dashboard entity"),
});

export type DashboardData = z.infer<typeof DashboardSchema>;

export const DashboardDbSchema = DbSchema.merge(DashboardSchema);
export type DashboardDbEntity = z.infer<typeof DashboardDbSchema>;
