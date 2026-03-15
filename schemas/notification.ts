import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const NotificationSchema = z.object({});
export type Notification = z.infer<typeof NotificationSchema>;
export const NotificationDbSchema = DbSchema.merge(NotificationSchema);
export type NotificationDbEntity = z.infer<typeof NotificationDbSchema>;
