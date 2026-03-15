import { z } from "zod";
import { DbSchema } from "./db";

export const ValidateSchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the validate entity"),
});

export type ValidateData = z.infer<typeof ValidateSchema>;

export const ValidateDbSchema = DbSchema.merge(ValidateSchema);
export type ValidateDbEntity = z.infer<typeof ValidateDbSchema>;
