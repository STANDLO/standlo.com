import { z } from 'genkit';
import { getAi } from '../index';

export const extractHardwarePartsFlow = async (input: { description: string }) => {
    const ai = getAi();
    const { output } = await ai.generate({
        prompt: `
        Analyze the following text description of an exhibition stand or physical structure.
        Extract all structural materials mentioned.
        Estimate the complexity (low, medium, high).
        Estimate the total labor hours required.

        Description:
        ${input.description}
        `,
        output: {
            schema: z.object({
                materials: z.array(z.string()).describe("List of extracted material parts."),
                complexity: z.enum(['low', 'medium', 'high']).describe("Estimated complexity based on the text."),
                estimatedLaborHours: z.number().describe("Estimated hours needed to construct the parsed parts."),
            })
        }
    });

    if (!output) {
        throw new Error("No output generated from AI");
    }

    return output;
};
