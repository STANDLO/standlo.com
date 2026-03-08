import fs from 'fs';
import path from 'path';

const targetFile = path.resolve(process.cwd(), 'node_modules', 'firebase-tools', 'lib', 'emulator', 'hubExport.js');
const exportsDir = path.resolve(process.cwd(), 'exports');

if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
}

if (!fs.existsSync(targetFile)) {
    console.warn('⚠️ Warning: firebase-tools hubExport.js not found. Cannot patch emulator export path.');
    process.exit(0);
}

try {
    let content = fs.readFileSync(targetFile, 'utf8');

    // Check if already patched to avoid recursive patching
    if (content.includes("path.join(process.cwd(), 'exports', `firebase-export-`")) {
        console.log('✅ firebase-tools already patched for custom exports directory.');
        process.exit(0);
    }

    const targetString = "this.tmpDir = fs.mkdtempSync(`firebase-export-${new Date().getTime()}`);";
    const replacedString = "this.tmpDir = fs.mkdtempSync(require('path').join(process.cwd(), 'exports', `firebase-export-${new Date().getTime()}-`));";

    if (content.includes(targetString)) {
        content = content.replace(targetString, replacedString);
        fs.writeFileSync(targetFile, content, 'utf8');
        console.log('🔧 Patched firebase-tools hubExport.js to default Firebase Emulator exports into the ./exports directory.');
    } else {
        console.warn('⚠️ Warning: Target string not found in hubExport.js via replacement.');
    }
} catch (error) {
    console.warn('⚠️ Warning: Failed to patch firebase-tools:', error.message);
}
