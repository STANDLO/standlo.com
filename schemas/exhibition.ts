import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const ExhibitionSchema = z.object({});
export type Exhibition = z.infer<typeof ExhibitionSchema>;
export const ExhibitionDbSchema = DbSchema.merge(ExhibitionSchema);
export type ExhibitionDbEntity = z.infer<typeof ExhibitionDbSchema>;
