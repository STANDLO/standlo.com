import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const InvoiceSchema = z.object({});
export type Invoice = z.infer<typeof InvoiceSchema>;
export const InvoiceDbSchema = DbSchema.merge(InvoiceSchema);
export type InvoiceDbEntity = z.infer<typeof InvoiceDbSchema>;
