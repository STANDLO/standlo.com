import { z } from "zod";
import { DbSchema } from "./db";

export const QuoteSchema = z.object({
  // Auto-scaffolded base properties
  name: z.string().optional().describe("Primary identifier or name for the quote entity"),
});

export type QuoteData = z.infer<typeof QuoteSchema>;

export const QuoteDbSchema = DbSchema.merge(QuoteSchema);
export type QuoteDbEntity = z.infer<typeof QuoteDbSchema>;
