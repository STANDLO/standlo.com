import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const PaymentSchema = z.object({});
export type Payment = z.infer<typeof PaymentSchema>;
export const PaymentDbSchema = DbSchema.merge(PaymentSchema);
export type PaymentDbEntity = z.infer<typeof PaymentDbSchema>;
