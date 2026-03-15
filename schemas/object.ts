import { z } from "zod";
import { DbSchema } from "./db";

export const ObjectSchema = z.object({
  name: z.string().optional().describe("Primary identifier or name for the object entity"),
  type: z.string().optional().describe("Type or category of the object"),
  // Universal Spatial properties for handling 3D instances inside containers
  dimension: z.tuple([z.number(), z.number(), z.number()]).default([1, 1, 1]).describe("Scale or physical dimension [x,y,z]"),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]).describe("Local or world position [x,y,z]"),
  rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]).describe("Euler rotation [x,y,z]"),
  visible: z.boolean().default(true).describe("Render visibility state"),
  data: z.record(z.string(), z.any()).optional().describe("Generic dynamic state payload"),
});

export type ObjectData = z.infer<typeof ObjectSchema>;

export const ObjectDbSchema = DbSchema.merge(ObjectSchema);
export type ObjectDbEntity = z.infer<typeof ObjectDbSchema>;
