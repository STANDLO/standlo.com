import { z } from "zod";
import { TaxSchema } from "./tax";
import { DbSchema } from "./db";

export const LocaleSchema = z.object({
  code: z.string().length(2).describe("2 digit country code to be used as Firestore UID"),
  nativeLabel: z.string(),
  name: z.string(),
  flag: z.string(),
  default: z.boolean().default(false),
  active: z.boolean().default(true),
  taxes: z.array(TaxSchema).default([]),
});

export type Locale = z.infer<typeof LocaleSchema>;

export const LocaleDbSchema = DbSchema.merge(LocaleSchema);
export type LocaleDbEntity = z.infer<typeof LocaleDbSchema>;

export const InputLocaleSchema = z.object({
  us: z.string().optional(),
  it: z.string().optional(),
  es: z.string().optional(),
  de: z.string().optional(),
  fr: z.string().optional(),
  gb: z.string().optional(),
  jp: z.string().optional(),
  ch: z.string().optional(),
  ae: z.string().optional(),
  au: z.string().optional(),
}).describe("Multi-language robust structure mapped to current active locales");

export type InputLocale = z.infer<typeof InputLocaleSchema>;

import localesJson from "./locales.json";

export const Locales = Object.values(localesJson).map((locale) => ({
  ...(locale as unknown as LocaleDbEntity), // Type assertion to the inferred db type
  id: locale.code,    // Ensuring the ID is identically populated just like the sync module
}));
