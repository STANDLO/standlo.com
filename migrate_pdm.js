const fs = require('fs');
const path = require('path');

const pdmDir = path.join(__dirname, 'admin/app/pdm');
const folders = ['assemblies', 'bundles', 'stands', 'parts'];

folders.forEach(folder => {
    const filePath = path.join(pdmDir, folder, 'page.tsx');
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf8');

    // Remove LocalizedString type
    content = content.replace(/type LocalizedString = \{\n(?:\s+\w+\??:\s*string;\n)+\};\n\n/g, '');

    // Replace LocalizedString usages
    content = content.replace(/name:\s*LocalizedString;/g, 'name: string;');
    content = content.replace(/description\?:\s*LocalizedString;/g, 'description?: string;');
    content = content.replace(/name\?:\s*LocalizedString/g, 'name?: string');

    // Add normalizer helper near the top
    if (!content.includes('const normalizeString =')) {
        content = content.replace('export default function', `
const normalizeString = (val: any): string => {
    if (!val) return "";
    if (typeof val === "object") return val.it || val.en || Object.values(val)[0] || "";
    return String(val);
};

export default function`);
    }

    // Fix openEditor empty state
    content = content.replace(/name:\s*\{\s*it:\s*"",\s*en:\s*""\s*\}/g, 'name: ""');
    content = content.replace(/description:\s*\{\s*it:\s*"",\s*en:\s*""\s*\}/g, 'description: ""');

    // Fix inputs
    content = content.replace(/editing\.name\.en/g, 'editing.name');
    content = content.replace(/name:\s*\{\s*\.\.\.editing\.name,\s*en:\s*e\.target\.value\s*\}/g, 'name: e.target.value');
    content = content.replace(/editing\.description(?:\["en"\]|\.en)/g, 'editing.description');
    content = content.replace(/description:\s*\{\s*\.\.\.editing\.description,\s*en:\s*e\.target\.value\s*\}/g, 'description: e.target.value');

    // Fix rendering in UI (table rows, lists, etc)
    content = content.replace(/\.name\?\.en\s*\|\|/g, '.name ||');
    content = content.replace(/\.name\.en\s*\|\|/g, '.name ||');
    
    // Normalize data when loading dicts
    content = content.replace(/dict\[item\.id\] = item;/g, 'dict[item.id] = { ...item, name: normalizeString(item.name) };');
    content = content.replace(/dict\[item\.id\] = \{\s*cost: item\.cost,\s*name: item\.name\s*\};/g, 'dict[item.id] = { cost: item.cost, name: normalizeString(item.name) };');

    // Normalize data when loading main lists
    content = content.replace(/const enriched = resultData\.map\(\(a:.*?\)\s*=>\s*\(\{\s*\.\.\.a,/g, match => {
        return match + '\n                name: normalizeString(a.name),';
    });

    fs.writeFileSync(filePath, content);
    console.log(`Migrated ${folder}`);
});
