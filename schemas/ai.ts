import { z } from "zod";
import { DbSchema } from "./db";

export const AiSchema = z.object({
  skillId: z.string().min(1).describe("The unique identifier used by the brain node (e.g. ai_summary)"),
  displayName: z.string().min(1).describe("Human readable name"),
  description: z.string().describe("Description of what this AI skill does"),
  prompt: z.string().describe("The system prompt with handlebars {{variables}}"),
  inputSchemaJson: z.string().describe("JSON Schema definition string for inputs"),
  outputSchemaJson: z.string().describe("JSON Schema definition string for formatted structured output"),
  mockPayloadJson: z.string().optional().describe("A mock JSON payload to load in the Sandbox test tool"),
  modelName: z.string().default('googleai/gemini-2.5-flash').describe("The specific LLM to use for this execution"),
  isActive: z.boolean().default(true).describe("Whether this AI skill is available in the pipeline builder"),
});

export type AiEntity = z.infer<typeof AiSchema>;

export const AiDbSchema = DbSchema.merge(AiSchema);
export type AiDbEntity = z.infer<typeof AiDbSchema>;
