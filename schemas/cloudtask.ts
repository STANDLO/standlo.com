import { z } from "zod";
import { DbSchema } from "./db";

export const CloudtaskSchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the cloudtask entity"),
});

export type CloudtaskData = z.infer<typeof CloudtaskSchema>;

export const CloudtaskDbSchema = DbSchema.merge(CloudtaskSchema);
export type CloudtaskDbEntity = z.infer<typeof CloudtaskDbSchema>;
