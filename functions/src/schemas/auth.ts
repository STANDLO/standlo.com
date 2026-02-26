import { z } from "zod";
import { BaseSchema } from "./base";
import { SystemRoles, RoleIdSchema, RoleId } from "./primitives";

export { SystemRoles, RoleIdSchema };
export type { RoleId };

/*
* Role Schema
*/
export const RoleSchema = BaseSchema.extend({});
export type Role = z.infer<typeof RoleSchema>;
