import { z } from "zod";
import { DbSchema } from "./db";

export const SlotSchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the slot entity"),
});

export type SlotData = z.infer<typeof SlotSchema>;

export const SlotDbSchema = DbSchema.merge(SlotSchema);
export type SlotDbEntity = z.infer<typeof SlotDbSchema>;
