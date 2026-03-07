"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeDynamicSkill = executeDynamicSkill;
const genkit_1 = require("genkit");
const index_1 = require("./index");
// Simple converter from JSON schema to Zod
// Handles basic types: string, number, boolean, arrays, and enums
function createZodSchemaFromJson(jsonSchemaStr) {
    if (!jsonSchemaStr)
        return null;
    try {
        const schemaObj = JSON.parse(jsonSchemaStr);
        if (!schemaObj.properties || Object.keys(schemaObj.properties).length === 0)
            return null;
        const shape = {};
        for (const [key, prop] of Object.entries(schemaObj.properties)) {
            const p = prop;
            let zodType = genkit_1.z.string();
            if (p.enum && Array.isArray(p.enum) && p.enum.length > 0) {
                zodType = genkit_1.z.enum(p.enum);
            }
            else if (p.type === 'number') {
                zodType = genkit_1.z.number();
            }
            else if (p.type === 'boolean') {
                zodType = genkit_1.z.boolean();
            }
            else if (p.type === 'array') {
                if (p.items && p.items.type === 'string') {
                    zodType = genkit_1.z.array(genkit_1.z.string());
                }
                else if (p.items && p.items.type === 'number') {
                    zodType = genkit_1.z.array(genkit_1.z.number());
                }
                else {
                    zodType = genkit_1.z.array(genkit_1.z.any());
                }
            }
            if (p.description) {
                zodType = zodType.describe(p.description);
            }
            // By default, if it's not strictly required in the JSON schema, we can make it optional
            // or we keep it required if we want strict output.
            if (!schemaObj.required || !schemaObj.required.includes(key)) {
                zodType = zodType.optional();
            }
            shape[key] = zodType;
        }
        return genkit_1.z.object(shape);
    }
    catch (e) {
        console.error("Failed to parse dynamic schema", e);
        return genkit_1.z.any();
    }
}
/**
 * Executes a dynamic AI skill stored in Firestore.
 */
async function executeDynamicSkill(skillDoc, payloadObj) {
    // 1. Construct the Zod schemas from the database payload
    const outputSchema = createZodSchemaFromJson(skillDoc.outputSchemaJson);
    // 2. Build the final prompt
    let finalPrompt = skillDoc.prompt || "Execute the requested task.";
    // Simple interpolation for {{ field }} matches
    const usedKeys = new Set();
    finalPrompt = finalPrompt.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, p1) => {
        if (payloadObj[p1] !== undefined) {
            usedKeys.add(p1);
            return typeof payloadObj[p1] === 'object' ? JSON.stringify(payloadObj[p1]) : String(payloadObj[p1]);
        }
        return match;
    });
    // If there are leftover payload fields that were not explicitly mentioned in the prompt, append them as Context
    const remainingPayload = Object.fromEntries(Object.entries(payloadObj).filter(([k]) => !usedKeys.has(k)));
    if (Object.keys(remainingPayload).length > 0) {
        finalPrompt += `\n\n--- Additional Input Context ---\n${JSON.stringify(remainingPayload, null, 2)}`;
    }
    // 3. Generate output using Genkit
    const ai = (0, index_1.getAi)();
    // Prepare options, only pass schema if we have a valid one (so we don't force empty JSON objects)
    const generateOptions = {
        model: skillDoc.modelName || 'googleai/gemini-2.5-flash',
        prompt: finalPrompt,
    };
    if (skillDoc.outputFormat === 'media') {
        generateOptions.output = {
            format: 'media'
        };
    }
    else if (outputSchema) {
        generateOptions.output = {
            schema: outputSchema
        };
    }
    const response = await ai.generate(generateOptions);
    if (!response || (!response.output && !response.text && !response.media)) {
        throw new Error(`Failed to generate output from AI Skill: ${skillDoc.displayName}`);
    }
    if (skillDoc.outputFormat === 'media') {
        // Support multimodal media outputs natively 
        return response.media || response.text;
    }
    // Return the structured object if there's a schema, otherwise return the raw text
    return outputSchema ? response.output : response.text;
}
//# sourceMappingURL=dynamicFlow.js.map