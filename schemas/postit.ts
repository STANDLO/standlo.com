import { z } from "zod";
import { DbSchema } from "./db";

export const PostitSchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the postit entity"),
});

export type PostitData = z.infer<typeof PostitSchema>;

export const PostitDbSchema = DbSchema.merge(PostitSchema);
export type PostitDbEntity = z.infer<typeof PostitDbSchema>;
