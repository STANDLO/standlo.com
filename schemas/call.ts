import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const CallSchema = z.object({
    apiKeyHint: z.string().describe(JSON.stringify("text")),
    status: z.number().describe(JSON.stringify("number")),
    method: z.string().optional().describe(JSON.stringify("text")),
    durationMs: z.number().optional().describe(JSON.stringify("number")),
});
export type Call = z.infer<typeof CallSchema>;
export const CallDbSchema = DbSchema.merge(CallSchema);
export type CallDbEntity = z.infer<typeof CallDbSchema>;
