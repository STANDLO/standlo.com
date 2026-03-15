import { z } from "zod";
import { DbSchema } from "./db";

export const QaSchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the qa entity"),
});

export type QaData = z.infer<typeof QaSchema>;

export const QaDbSchema = DbSchema.merge(QaSchema);
export type QaDbEntity = z.infer<typeof QaDbSchema>;
