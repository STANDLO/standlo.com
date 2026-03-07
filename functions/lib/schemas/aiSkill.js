"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AISkillSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
/**
 * AI Skill Schema (Admin managed Dynamic Genkit Prompts)
 */
exports.AISkillSchema = base_1.BaseSchema.extend({
    skillId: zod_1.z.string().min(1).describe("The unique identifier used by the brain node (e.g. ai_summary)"),
    displayName: zod_1.z.string().min(1).describe("Human readable name"),
    description: zod_1.z.string().describe("Description of what this AI skill does"),
    prompt: zod_1.z.string().describe("The system prompt with handlebars {{variables}}"),
    inputSchemaJson: zod_1.z.string().describe("JSON Schema definition string for inputs"),
    outputSchemaJson: zod_1.z.string().describe("JSON Schema definition string for formatted structured output"),
    modelName: zod_1.z.string().default('googleai/gemini-2.5-flash').describe("The specific LLM to use for this execution"),
    isActive: zod_1.z.boolean().default(true).describe("Whether this AI skill is available in the pipeline builder"),
});
//# sourceMappingURL=aiSkill.js.map