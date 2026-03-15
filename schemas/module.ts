import { z } from "zod";
import { DbSchema } from "./db";

export const ModuleSchema = z.object({
  appId: z.string().describe("Foreign key to the parent App code"),
  name: z.string().optional().describe("Human readable string name"),
  route: z.string().optional().describe("URL slug for the module UI (e.g., '/parts')"),
  icon: z.string().describe("Lucide icon string reference"),
  nav: z.boolean().optional().default(true).describe("Whether to show this module in the Top Navigation"),
  share: z.boolean().optional().default(false).describe("Whether this module can be externally shared"),
  default: z.boolean().optional().default(false).describe("Indicates the default overarching root application"),
  order: z.number().int().describe("Display order metric"),
});

export type ModuleData = z.infer<typeof ModuleSchema>;

export const ModuleDbSchema = DbSchema.merge(ModuleSchema);
export type ModuleDbEntity = z.infer<typeof ModuleDbSchema>;

import * as React from "react";
import * as LucideIcons from "lucide-react";
import modulesJson from "./modules.json";

export const Modules = (modulesJson as ModuleDbEntity[]).map((mod) => {
  const IconComponent = (LucideIcons as any)[mod.icon] || LucideIcons.Box;
  return {
    ...mod,
    iconNode: React.createElement(IconComponent, { size: 18 }),
  };
});
