import { z } from 'genkit';
import { getAi } from './index';

// Simple converter from JSON schema to Zod
// Handles basic types: string, number, boolean, arrays, and enums
function createZodSchemaFromJson(jsonSchemaStr: string): z.ZodTypeAny | null {
    if (!jsonSchemaStr) return null;
    try {
        const schemaObj = JSON.parse(jsonSchemaStr);
        if (!schemaObj.properties || Object.keys(schemaObj.properties).length === 0) return null;

        const shape: Record<string, z.ZodTypeAny> = {};
        for (const [key, prop] of Object.entries(schemaObj.properties as Record<string, unknown>)) {
            const p = prop as Record<string, any>;
            let zodType: z.ZodTypeAny = z.string();

            if (p.enum && Array.isArray(p.enum) && p.enum.length > 0) {
                zodType = z.enum(p.enum as [string, ...string[]]);
            } else if (p.type === 'number') {
                zodType = z.number();
            } else if (p.type === 'boolean') {
                zodType = z.boolean();
            } else if (p.type === 'array') {
                if (p.items && p.items.type === 'string') {
                    zodType = z.array(z.string());
                } else if (p.items && p.items.type === 'number') {
                    zodType = z.array(z.number());
                } else {
                    zodType = z.array(z.any());
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
        return z.object(shape);
    } catch (e) {
        console.error("Failed to parse dynamic schema", e);
        return z.any();
    }
}

/**
 * Executes a dynamic AI skill stored in Firestore.
 */
export async function executeDynamicSkill(skillDoc: any, payloadObj: Record<string, unknown>) {
    // 1. Construct the Zod schemas from the database payload
    const outputSchema = createZodSchemaFromJson(skillDoc.outputSchemaJson);

    // 2. Build the final prompt
    let finalPrompt = skillDoc.prompt || "Execute the requested task.";

    // Simple interpolation for {{ field }} matches
    const usedKeys = new Set<string>();
    finalPrompt = finalPrompt.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match: string, p1: string) => {
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
    const ai = getAi();

    // Prepare options, only pass schema if we have a valid one (so we don't force empty JSON objects)
    const generateOptions: any = {
        model: skillDoc.modelName || 'googleai/gemini-2.5-flash',
        prompt: finalPrompt,
    };

    if (skillDoc.outputFormat === 'media') {
        generateOptions.output = {
            format: 'media'
        };
    } else if (outputSchema) {
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
