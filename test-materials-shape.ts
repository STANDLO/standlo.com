import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./src/core/constants/canvas_materials.json', 'utf8'));
console.log(data[0]);
