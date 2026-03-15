import { z } from "zod";
import { DbSchema } from "./db";

export const ProvideSchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the provide entity"),
});

export type ProvideData = z.infer<typeof ProvideSchema>;

export const ProvideDbSchema = DbSchema.merge(ProvideSchema);
export type ProvideDbEntity = z.infer<typeof ProvideDbSchema>;
