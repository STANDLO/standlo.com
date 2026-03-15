import { z } from "zod";
import { DbSchema } from "./db";

export const SellSchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the sell entity"),
});

export type SellData = z.infer<typeof SellSchema>;

export const SellDbSchema = DbSchema.merge(SellSchema);
export type SellDbEntity = z.infer<typeof SellDbSchema>;
