const fs = require('fs');
const path = require('path');
const files = ['assembly.ts', 'bundle.ts', 'mesh.ts', 'part.ts', 'process.ts', 'stand.ts', 'tool.ts'];
files.forEach(file => {
    const p = path.join(__dirname, 'src/orchestrator/' + file);
    if (!fs.existsSync(p)) return;
    let t = fs.readFileSync(p, 'utf8');
    if (!t.includes('deletedAt: null')) {
        // We want to add deletedAt: null, isArchived: false to the created document block.
        // The created document block always ends with:
        //         updatedBy: uid
        //     };

        // Look for `updatedBy: uid` not followed by a comma
        t = t.replace(/updatedBy:\s*uid\n\s*\};/g, 'updatedBy: uid,\n        deletedAt: null,\n        isArchived: false\n    };');
        fs.writeFileSync(p, t);
        console.log('patched ' + file);
    } else {
        console.log('already patched ' + file);
    }
});
