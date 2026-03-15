import { z } from "zod";
import { DbSchema } from "./db";

export const BuySchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the buy entity"),
});

export type BuyData = z.infer<typeof BuySchema>;

export const BuyDbSchema = DbSchema.merge(BuySchema);
export type BuyDbEntity = z.infer<typeof BuyDbSchema>;
