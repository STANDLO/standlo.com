const fs = require('fs');
const path = require('path');

const pdmDir = path.join(__dirname, 'admin/app/pdm');
const folders = ['assemblies', 'bundles', 'stands', 'parts'];

folders.forEach(folder => {
    const filePath = path.join(pdmDir, folder, 'page.tsx');
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/list<\{ id: string, cost\?: number, price\?: number \}>/g, 'list<{ id: string, name?: string, cost?: number, price?: number }>');
    content = content.replace(/Record<string, \{ cost\?: number, price\?: number \}>/g, 'Record<string, { name?: string, cost?: number, price?: number }>');

    fs.writeFileSync(filePath, content);
    console.log(`Fixed TS in ${folder}`);
});
