import { z } from "zod";
import { DbSchema } from "./db";

export const ColorSchema = z.object({
  id: z.string().describe("Hex code without # as UID, or specific format like RAL-9010"),
  type: z.enum(["ral", "ncs", "pantone", "css-semantic"]).optional(),
  code: z.string().optional().describe("Specific code within the type system (e.g. 9010 for RAL)"),
  name: z.string().describe("Name, often dynamically assembled as [TYPE]-[CODE], or Figma name"),
  rgb: z.object({
    r: z.number().min(0).max(255),
    g: z.number().min(0).max(255),
    b: z.number().min(0).max(255)
  }),
  hsl: z.object({
    h: z.number().min(0).max(360),
    s: z.number().min(0).max(100),
    l: z.number().min(0).max(100)
  }),
  cmyk: z.object({
    c: z.number().min(0).max(100),
    m: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
    k: z.number().min(0).max(100)
  }).optional(),
  alpha: z.number().min(0).max(1).default(1)
});

export type ColorDef = z.infer<typeof ColorSchema>;

export const ColorDbSchema = DbSchema.merge(ColorSchema);
export type ColorDbEntity = z.infer<typeof ColorDbSchema>;

import colorsJson from "./colors.json";
export const Colors = colorsJson as unknown as ColorDbEntity[];
