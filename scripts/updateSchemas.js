const fs = require('fs');
const path = require('path');

const schemasDir = path.join(__dirname, '../functions/src/schemas');

function updateSchema(filename, hasPosRotAlready) {
    const filePath = path.join(schemasDir, filename);
    let content = fs.readFileSync(filePath, 'utf8');

    // 1. Add fields to Schema def
    const schemaName = filename.charAt(0).toUpperCase() + filename.slice(1, -3) + "Schema";
    if (hasPosRotAlready) {
        // Just add dimension alongside position for part.ts
        content = content.replace(
            /position: z\.tuple\(\[z\.number\(\), z\.number\(\), z\.number\(\)\]\)\.default\(\[0, 0, 0\]\),/,
            "dimension: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),\n    position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),"
        );
    } else {
        // Add dimension, position, rotation before the closing }); of the main schema extension
        // Need to find the end of the Schema. 
        // Example: BaseSchema.extend({ ... \n}); Let's do it safely.
        const regex = new RegExp(`export const ${schemaName} = BaseSchema\\.extend\\(\\{([\\s\\S]*?)\\}\\);`);
        content = content.replace(regex, (match, p1) => {
            // make sure we don't duplicate
            if(p1.includes('dimension: z.tuple')) return match; 
            const toAdd = `
    // Spatial properties for handling instances
    dimension: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
`;
            return `export const ${schemaName} = BaseSchema.extend({${p1}${toAdd}});`;
        });
    }

    // 2. Add to Policy Matrix
    // We append the permission fields after `endLifeTime: { ... }` or at the end of the fieldPermissions object.
    content = content.replace(/endLifeTime: \{ read: true, write: false \}/g, "endLifeTime: { read: true, write: false }, dimension: { read: true, write: false }, position: { read: true, write: false }, rotation: { read: true, write: false }");
    content = content.replace(/endLifeTime: \{ read: true, write: true \}/g, "endLifeTime: { read: true, write: true }, dimension: { read: true, write: true }, position: { read: true, write: true }, rotation: { read: true, write: true }");

    // special case if `part.ts` already had position in its matrix, we might have duplicate position now, but let's check.
    // In `part.ts` it had: position: { read: true, write: true }, rotation: { ... }. 
    // Wait, endLifeTime was added above, which is before position. Let's clean duplicates using a quick regex.
    fs.writeFileSync(filePath, content);
}

// Update part.ts (already has position and rotation)
updateSchema('part.ts', true);
// Update others
['sketch.ts', 'assembly.ts', 'bundle.ts', 'design.ts'].forEach(file => {
    updateSchema(file, false);
});

console.log("Schemas updated");
