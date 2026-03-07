import fs from 'fs';
import { resolve } from 'path';

console.log('🔧 Patching firebase-functions SDK to prevent Eventarc "namespace" filter error for Enterprise Firestore...');

const functionsDir = resolve(process.cwd(), 'functions');
const targetFile = resolve(functionsDir, 'node_modules/firebase-functions/lib/v2/providers/firestore.js');

try {
    let content = fs.readFileSync(targetFile, 'utf-8');

    // We rewrite the eventFilters block to omit namespace if it is the default.
    // Use regex to ignore whitespace/tab differences
    const targetRegex = /const eventFilters = \{\s*database,\s*namespace\s*\};/;

    const replacementString = `const eventFilters = { database };\n\tif (namespace && namespace !== "(default)" && namespace !== "{namespaceId}") {\n\t\teventFilters.namespace = namespace;\n\t}`;

    if (targetRegex.test(content)) {
        content = content.replace(targetRegex, replacementString);
        fs.writeFileSync(targetFile, content);
        console.log('✅ Successfully patched firestore.js Eventarc filters.');
    } else {
        console.log('⚠️ Warning: Target string not found in firestore.js via regex.');
    }
} catch (e) {
    console.error('❌ Failed to patch firebase-functions:', e.message);
}
