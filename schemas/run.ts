import { z } from "zod";
import { DbSchema } from "./db";

export const RunSchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the run entity"),
});

export type RunData = z.infer<typeof RunSchema>;

export const RunDbSchema = DbSchema.merge(RunSchema);
export type RunDbEntity = z.infer<typeof RunDbSchema>;
