import { DbSchema } from "./db";
import { z } from "zod";
import { VectorSchema } from "./vector";
import { InputLocaleSchema } from "./locale";

export const MetadataSchema = z.object({
  names: InputLocaleSchema.optional().describe("Localized semantic titles for vectorization"),
  descriptions: InputLocaleSchema.optional().describe("Localized summaries for vectorization"),
  tags: z.array(z.string()).default([]).describe("Automatically extracted semantic tags"),
  category: z.string().optional().describe("Broad classification (e.g. documentation, discussion)"),
  language: z.string().length(2).optional().describe("Language of the source material"),
  
  // Vector search data
  vectors: z.array(VectorSchema).default([]).describe("Embeddings generated for this document"),
  
  // Tracking
  status: z.enum(["pending", "processing", "completed", "failed"]).default("pending").describe("AI extraction status"),
  lastExtractedAt: z.number().optional().describe("When the AI last read and updated this metadata"),
  errorReason: z.string().optional(),
});

export type Metadata = z.infer<typeof MetadataSchema>;

export const MetadataDbSchema = DbSchema.merge(MetadataSchema);
export type MetadataDbEntity = z.infer<typeof MetadataDbSchema>;
