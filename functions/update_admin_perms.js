const fs = require('fs');
const path = require('path');

const schemasPath = path.join(__dirname, 'lib', 'schemas');
const srcSchemasPath = path.join(__dirname, 'src', 'schemas');

const files = [
  { file: 'part.ts', name: 'Part' },
  { file: 'mesh.ts', name: 'Mesh' },
  { file: 'assembly.ts', name: 'Assembly' },
  { file: 'stand.ts', name: 'Stand' },
  { file: 'bundle.ts', name: 'Bundle' }
];

async function update() {
  for (const { file, name } of files) {
    try {
      // 1. Get the compiled schema to extract all fields
      const mod = require(path.join(schemasPath, file.replace('.ts', '.js')));
      const schemaName = `${name}Schema`;
      const schema = mod[schemaName];
      
      let keys = [];
      if (schema && schema.shape) {
        keys = Object.keys(schema.shape);
      } else {
        console.warn(`Could not find shape for ${schemaName} in ${file}`);
        continue;
      }
      
      const fieldPerms = keys.map(k => `${k}: { read: true, write: true }`).join(', ');
      const readOnlyPerms = keys.map(k => `${k}: { read: true, write: false }`).join(', ');

      const adminPolicy = `{ canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: { ${fieldPerms} } }`;
      const guestPolicy = `{ canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: { ${readOnlyPerms} } }`;

      // 2. Modify the TypeScript source
      const tsPath = path.join(srcSchemasPath, file);
      let content = fs.readFileSync(tsPath, 'utf-8');

      // Helper function to replace a role's policy robustly
      function replaceRolePolicy(source, role, newPolicy) {
        // Find the start of the role key
        const roleIndex = source.indexOf(`${role}: {`);
        if (roleIndex === -1) {
            console.warn(`Role ${role} not found in ${file}`);
            return source;
        }

        // Find the matching closing brace
        let openBraces = 0;
        let startBraceIndex = source.indexOf('{', roleIndex);
        let currentPos = startBraceIndex;

        while (currentPos < source.length) {
            if (source[currentPos] === '{') openBraces++;
            if (source[currentPos] === '}') openBraces--;
            
            if (openBraces === 0) break;
            currentPos++;
        }

        const endBraceIndex = currentPos;
        
        return source.substring(0, roleIndex) + 
               `${role}: ${newPolicy}` + 
               source.substring(endBraceIndex + 1);
      }

      content = replaceRolePolicy(content, 'standlo_manager', adminPolicy);
      content = replaceRolePolicy(content, 'standlo_designer', adminPolicy);
      content = replaceRolePolicy(content, 'guest', guestPolicy);
      
      fs.writeFileSync(tsPath, content);
      console.log(`Updated permissions for ${file}`);
    } catch (e) {
      console.error(`Error processing ${file}:`, e);
    }
  }
}

update();
