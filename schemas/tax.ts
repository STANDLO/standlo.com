import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const TaxSchema = z.object({});
export type Tax = z.infer<typeof TaxSchema>;
export const TaxDbSchema = DbSchema.merge(TaxSchema);
export type TaxDbEntity = z.infer<typeof TaxDbSchema>;
