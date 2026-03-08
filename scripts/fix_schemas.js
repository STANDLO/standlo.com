const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../functions/src/schemas');
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (!file.endsWith('.ts')) return;
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    const badStr = 'dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {},\n    standlo_manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },\n    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },\n    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },\n    standlo_designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} } }';
    const goodStr = 'dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },\n    standlo_manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },\n    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },\n    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },\n    standlo_designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }';

    if (content.includes(badStr)) {
        content = content.replace(badStr, goodStr);
        fs.writeFileSync(filePath, content);
        console.log('Fixed', file);
    }
});
