"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractHardwarePartsFlow = void 0;
const genkit_1 = require("genkit");
const index_1 = require("../index");
const extractHardwarePartsFlow = async (input) => {
    const ai = (0, index_1.getAi)();
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
            schema: genkit_1.z.object({
                materials: genkit_1.z.array(genkit_1.z.string()).describe("List of extracted material parts."),
                complexity: genkit_1.z.enum(['low', 'medium', 'high']).describe("Estimated complexity based on the text."),
                estimatedLaborHours: genkit_1.z.number().describe("Estimated hours needed to construct the parsed parts."),
            })
        }
    });
    if (!output) {
        throw new Error("No output generated from AI");
    }
    return output;
};
exports.extractHardwarePartsFlow = extractHardwarePartsFlow;
//# sourceMappingURL=exampleAnalysisFlow.js.map