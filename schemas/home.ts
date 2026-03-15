import { z } from "zod";
import { DbSchema } from "./db";

export const HomeSchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the home entity"),
});

export type HomeData = z.infer<typeof HomeSchema>;

export const HomeDbSchema = DbSchema.merge(HomeSchema);
export type HomeDbEntity = z.infer<typeof HomeDbSchema>;
