import { z } from "zod";
import { ColorSchema } from "./color";
import { DbSchema } from "./db";

export const ThemeSchema = z.object({
  id: z.string().describe("A unique identifier for the theme like 'light', 'dark', 'brand'"),
  name: z.string().describe("Human readable name"),
  mode: z.enum(["light", "dark", "system"]),
  colors: z.array(ColorSchema).describe("Array of semantic colors used by this theme (primary, bg, text, etc.)")
});

export type ThemeDef = z.infer<typeof ThemeSchema>;

export const ThemeDbSchema = DbSchema.merge(ThemeSchema);
export type ThemeDbEntity = z.infer<typeof ThemeDbSchema>;

import themesJson from "./theme.json";
export const Themes = themesJson as unknown as ThemeDbEntity[];
