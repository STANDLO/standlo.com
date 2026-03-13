import { onRequest } from "firebase-functions/v2/https";
import { Registry } from "./entityRegistry";

export const schemaExporter = onRequest({ cors: true, region: "europe-west4" }, (req, res) => {
    // Basic extraction of collection configurations to serve as a manifest
    // for frontend generic forms and sync engines.
    const exportedSchemas: Record<string, unknown> = {};

    for (const [key, config] of Object.entries(Registry)) {
        // Zod objects store their properties in a .shape object internally
        const shape = (config.schema as { shape?: Record<string, unknown> }).shape || {};
        
        exportedSchemas[key] = {
            scope: config.scope,
            collection: config.name,
            // Provide a flat list of defined top-level keys for the schema
            fields: Object.keys(shape)
        };
    }

    res.json({
        status: "success",
        data: exportedSchemas
    });
});
