import { z } from "zod";
import { DbSchema } from "./db";

export const InsuranceSchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the insurance entity"),
});

export type InsuranceData = z.infer<typeof InsuranceSchema>;

export const InsuranceDbSchema = DbSchema.merge(InsuranceSchema);
export type InsuranceDbEntity = z.infer<typeof InsuranceDbSchema>;
