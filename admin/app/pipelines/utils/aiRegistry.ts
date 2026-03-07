import 'zod';
import { z } from 'zod';

export interface AISkill {
    skillId: string;
    displayName: string;
    description: string;
    inputSchema: z.ZodTypeAny;
    outputSchema: z.ZodTypeAny;
}

// Example Zod schemas for the initial demo flow
const ExtractPartsInputSchema = z.object({
    description: z.string().describe("The free-text description of the exhibit or stand structure."),
});

const ExtractPartsOutputSchema = z.object({
    materials: z.array(z.string()).describe("List of extracted material parts."),
    complexity: z.enum(['low', 'medium', 'high']).describe("Estimated complexity based on the text."),
    estimatedLaborHours: z.number().describe("Estimated hours needed to construct the parsed parts."),
});

// The central registry connecting AI skills to Frontend Pipeline Builder UI
export const AIRegistry: Record<string, AISkill> = {
    'ai_extract_hardware_parts': {
        skillId: 'ai_extract_hardware_parts',
        displayName: 'Extract Hardware Parts',
        description: 'Analyzes an exhibit text description and extracts structural materials and complexity.',
        inputSchema: ExtractPartsInputSchema,
        outputSchema: ExtractPartsOutputSchema,
    }
};
