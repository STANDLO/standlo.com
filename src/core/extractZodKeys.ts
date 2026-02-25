import { z } from "zod";

/**
 * Extracts the base schema from Zod wrappers (Optional, Nullable, Default, Effects).
 */
export function getBaseZodSchema(schema: z.ZodTypeAny): z.ZodTypeAny {
    let currentSchema = schema;

    while (
        currentSchema instanceof z.ZodOptional ||
        currentSchema instanceof z.ZodNullable ||
        currentSchema instanceof z.ZodDefault ||
        currentSchema.constructor.name === "ZodEffects"
    ) {
        if (currentSchema.constructor.name === "ZodEffects") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currentSchema = (currentSchema as any).innerType();
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            currentSchema = (currentSchema as any)._def.innerType;
        }
    }

    return currentSchema;
}

/**
 * Extracts a strict array of allowed keys from any ZodObject,
 * safely unwrapping nested modifiers (Optional, Nullable, Default, Effects).
 * Useful for filtering UI fields dynamically based on the final RBAC schema.
 */
export function extractZodKeys(schema: z.ZodTypeAny): string[] {
    const baseSchema = getBaseZodSchema(schema);

    if (baseSchema instanceof z.ZodObject) {
        return Object.keys(baseSchema.shape);
    }

    // Per intersection (es. A.and(B)) estraiamo da entrambi
    if (baseSchema instanceof z.ZodIntersection) {
        return [
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...extractZodKeys((baseSchema as any)._def.left),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...extractZodKeys((baseSchema as any)._def.right)
        ];
    }

    // Se non possiamo tracciare le chiavi, restituiamo un array vuoto
    return [];
}
