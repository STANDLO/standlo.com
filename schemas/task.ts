import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const TaskSchema = z.object({
    name: z.string(),
    description: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'done', 'blocked']).default('todo'),
    processId: z.string().optional(), // Reference to the Process
    assignedTo: z.string().optional(), // userId
    warehouseId: z.string() // Location where task is performed
});
export type Task = z.infer<typeof TaskSchema>;
export const TaskDbSchema = DbSchema.merge(TaskSchema);
export type TaskDbEntity = z.infer<typeof TaskDbSchema>;
