import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const FairSchema = z.object({});
export type Fair = z.infer<typeof FairSchema>;
export const FairDbSchema = DbSchema.merge(FairSchema);
export type FairDbEntity = z.infer<typeof FairDbSchema>;
