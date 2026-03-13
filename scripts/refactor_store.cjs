const fs = require('fs');
const path = require('path');

const designDir = path.join(__dirname, '../src/components/layout/design');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;
            
            // Replace relative imports to store
            content = content.replace(/from\s+["']\.\/store["']/g, 'from "@/lib/zustand"');
            content = content.replace(/from\s+["']\.\.\/store["']/g, 'from "@/lib/zustand"');
            content = content.replace(/from\s+["']@\/components\/layout\/design\/store["']/g, 'from "@/lib/zustand"');
            
            // Replace useDictionarySync naming to useDesignDictionaries
            content = content.replace(/useDictionarySync/g, 'useDesignDictionaries');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(designDir);
