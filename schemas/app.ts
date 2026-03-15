import { z } from "zod";
import { DbSchema } from "./db";

export const AppSchema = z.object({
  icon: z.string().describe("Lucide icon string reference"),
  order: z.number().int().describe("Display order metric"),
  active: z.boolean().optional().default(true).describe("Whether the application is active"),
  default: z.boolean().optional().default(false).describe("Indicates the default overarching root application"),
  nav: z.boolean().optional().default(true).describe("Should be visible in the central Application Switch matrix"),
  public: z.boolean().optional().default(true).describe("Visibility of the application"),
});

export type AppData = z.infer<typeof AppSchema>;

export const AppDbSchema = DbSchema.merge(AppSchema);
export type AppDbEntity = z.infer<typeof AppDbSchema>;

import * as React from "react";
import * as LucideIcons from "lucide-react";
import appsJson from "./apps.json";

export const Apps = (appsJson as AppDbEntity[]).map((app) => {
  // Dynamically pull the requested Lucide component or fallback to Box
  const IconComponent = (LucideIcons as any)[app.icon] || LucideIcons.Box;
  return {
    ...app,
    iconNode: React.createElement(IconComponent, { size: 18 }),
  };
});
