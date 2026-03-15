import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const ExhibitorSchema = z.object({});
export type Exhibitor = z.infer<typeof ExhibitorSchema>;
export const ExhibitorDbSchema = DbSchema.merge(ExhibitorSchema);
export type ExhibitorDbEntity = z.infer<typeof ExhibitorDbSchema>;
