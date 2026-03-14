const fs = require('fs');

const filePath = 'scripts/seedLocalPipelines.mjs';
let content = fs.readFileSync(filePath, 'utf8');

// We want to replace nodes that look like:
// {
//   "id": "act_ai_metadata",
//   "type": "action",
//   "position": { ... },
//   "data": {
//     "actionType": "brain",
//     "targetPath": "ai_metadata",
//     "payload": "..."
//   }
// }
//
// With:
// {
//   "id": "act_ai_metadata",
//   "type": "brain",
//   "position": { ... },
//   "data": {
//     "skillId": "ai_metadata",
//     "payload": "..."
//   }
// }

// Simple string replacements for the type and the data object
content = content.replace(/"type": "action",\s*"position": (\{[^}]+\}),\s*"data": \{\s*"actionType": "brain",\s*"targetPath": "([^"]+)",/g, 
  '"type": "brain",\n        "position": $1,\n        "data": {\n          "skillId": "$2",');

fs.writeFileSync(filePath, content);
console.log("Replaced action -> brain nodes successfully in seedLocalPipelines");
