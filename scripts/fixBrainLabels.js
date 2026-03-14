const fs = require('fs');

const filePath = 'scripts/seedLocalPipelines.mjs';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/"data": \{\s*"skillId": "([^"]+)",/g, 
  '"data": {\n          "label": "$1",\n          "skillId": "$1",');

fs.writeFileSync(filePath, content);
console.log("Labels added successfully to brain nodes.");
