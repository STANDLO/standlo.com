import { z } from "zod";
import { BaseSchema } from "./base";
/**
 * AI Skill Schema (Admin managed Dynamic Genkit Prompts)
 */
export const AISkillSchema = BaseSchema.extend({
    skillId: z.string().min(1).describe("The unique identifier used by the brain node (e.g. ai_summary)"),
    displayName: z.string().min(1).describe("Human readable name"),
    description: z.string().describe("Description of what this AI skill does"),
    prompt: z.string().describe("The system prompt with handlebars {{variables}}"),
    inputSchemaJson: z.string().describe("JSON Schema definition string for inputs"),
    outputSchemaJson: z.string().describe("JSON Schema definition string for formatted structured output"),
    modelName: z.string().default('googleai/gemini-2.5-flash').describe("The specific LLM to use for this execution"),
    isActive: z.boolean().default(true).describe("Whether this AI skill is available in the pipeline builder"),
});
export type AISkillEntity = z.infer<typeof AISkillSchema>;
