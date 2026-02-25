import * as fs from 'fs';
import * as path from 'path';

const entities = [
    'activity', 'apikey', 'assembly', 'calendar', 'call', 'exhibition',
    'exhibitor', 'fair', 'invoice', 'message', 'notification', 'part',
    'payment', 'process', 'project', 'shelve', 'stand', 'tax',
    'tool', 'user', 'warehouse', 'workcenter'
];

const basePath = path.join(process.cwd(), 'functions', 'src', 'schemas');

const newMatrixPart = `    pending: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    engineer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    electrician: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plumber: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    carpenter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    cabinetmaker: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    ironworker: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    windowfitter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    glazier: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    riggers: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standbuilder: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plasterer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    painter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    tiler: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    driver: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    forkliftdriver: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    promoter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    other: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },`;

for (const entity of entities) {
    // Skip user which has a custom logic
    if (entity === 'user') continue;

    const filepath = path.join(basePath, `${entity}.ts`);
    if (!fs.existsSync(filepath)) continue;

    let content = fs.readFileSync(filepath, 'utf8');

    // Remove the old PolicyMatrix content dynamically and replace it
    const StartRegex = new RegExp(`export const ${entity.charAt(0).toUpperCase() + entity.slice(1)}PolicyMatrix: Record<RoleId, EntityPolicy> = {`);

    // We just replace the entire matrix manually using regex
    content = content.replace(
        new RegExp(`export const ${entity.charAt(0).toUpperCase() + entity.slice(1)}PolicyMatrix: Record<RoleId, EntityPolicy> = {[\\s\\S]*?};`),
        `export const ${entity.charAt(0).toUpperCase() + entity.slice(1)}PolicyMatrix: Record<RoleId, EntityPolicy> = {\n${newMatrixPart}\n};`
    );

    fs.writeFileSync(filepath, content, 'utf8');
}

console.log("Matrices updated.");
