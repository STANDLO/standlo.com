import { z } from "zod";
import { DbSchema } from "./db";
import * as React from "react";
import * as LucideIcons from "lucide-react";
import rolesJson from "./roles.json";

export const RoleSchema = z.object({
  name: z.string().describe("Role display name"),
  icon: z.string().describe("Lucide icon string reference"),
});

export type RoleData = z.infer<typeof RoleSchema>;

export const RoleDbSchema = DbSchema.merge(RoleSchema);
export type RoleDbEntity = z.infer<typeof RoleDbSchema>;

export const Roles = (rolesJson as RoleDbEntity[]).map((role) => {
  const IconComponent = (LucideIcons as any)[role.icon || "User"] || LucideIcons.User;
  return {
    ...role,
    iconNode: React.createElement(IconComponent, { size: 18 }),
  };
});
