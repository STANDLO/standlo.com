/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';
import { Registry } from '@standlo/functions/src/gateways/entityRegistry';

// A generic utility to map Firestore collection names and Orchestrator entity paths to their respective Zod schemas
export const CollectionSchemaRegistry: Record<string, z.ZodObject<any>> = {};
export const AvailableEntities: { id: string, name: string }[] = [];
export const AvailableCollections: { id: string, name: string }[] = [];

Object.keys(Registry).forEach((entityKey) => {
    const config = Registry[entityKey];
    // Add singular form (entityId) mapping to schema
    CollectionSchemaRegistry[entityKey] = config.schema as unknown as z.ZodObject<any>;

    // Add plural form (collection name) mapping to schema
    // Avoid overriding singulars with plurals if they are identical, though they shouldn't be.
    if (config.name) {
        CollectionSchemaRegistry[config.name] = config.schema as unknown as z.ZodObject<any>;
        AvailableCollections.push({
            id: config.name,
            name: config.name
        });
    }

    AvailableEntities.push({
        id: entityKey,
        name: entityKey.charAt(0).toUpperCase() + entityKey.slice(1) // Capitalize
    });
});

// Sort alphabetically for the UI dropdown
AvailableEntities.sort((a, b) => a.name.localeCompare(b.name));
AvailableCollections.sort((a, b) => a.name.localeCompare(b.name));

/**
 * Extracts and flattens available fields from a given Zod schema for GUI dropdowns.
 * Only basic scalar fields and top-level arrays/enums are currently extracted for simple logic queries.
 */
export function extractFieldsFromZod(schema: z.ZodObject<any> | undefined): { name: string, type: string, options?: string[], _def: any }[] {
    if (!schema || !schema.shape) return [];

    return Object.entries(schema.shape).map(([key, zodType]: [string, any]) => {
        let actualType = zodType;
        // Unwrap optional/nullable/default types generically
        while (actualType && actualType._def && actualType._def.innerType) {
            actualType = actualType._def.innerType;
        }

        const typeName = actualType.constructor.name || actualType._def.typeName || actualType._def.type;

        let options: string[] | undefined;
        if (typeName === 'ZodEnum' || typeName === 'enum') {
            options = Object.keys(actualType._def.entries || actualType._def.values || {});
            if (options.length === 0) options = undefined;
        } else if (typeName === 'ZodNativeEnum') {
            options = Object.values(actualType._def.values || actualType._def.entries || {});
        }

        return {
            name: key,
            type: typeName,
            options,
            _def: actualType._def
        };
    }).filter(field => !['id', 'createdAt', 'updatedAt', 'organizationId'].includes(field.name)); // Filter out unhelpful generic metadata
}
