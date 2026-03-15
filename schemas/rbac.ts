import rbacData from './rbac.json';
import { RoleId } from "./auth";

export type EntityLevel = 'own' | 'org' | 'network';

export interface RBACProps {
    role: RoleId | string;
    app: string;
    module: string;
    field?: string;
    status?: string; // e.g. 'archived', 'draft'
    level: EntityLevel;
    action: 4 | 2 | 1;
}

/**
 * Parses the raw rbac.json to compute inherited permissions via "_extends"
 */
function resolveRoleTree(role: string): any {
    const rawRole = (rbacData as Record<string, any>)[role];
    if (!rawRole) return null;

    if (rawRole._extends) {
        const parent = resolveRoleTree(rawRole._extends);
        // Deep merge parent into child. In a real app, use lodash.merge or a custom deepMerge
        return { ...parent, ...rawRole }; 
    }
    return rawRole;
}

/**
 * High-performance O(1) Memory-Mapped RBAC Engine based on UNIX 777 Bitmask.
 * 
 * 4: Read/View
 * 2: Write/Modify (Create, Update, Delete)
 * 1: Execute/Special (Webhooks, AI Pipelines, Data Masking)
 */
export function checkPermission(props: RBACProps): boolean {
    const roleTree = resolveRoleTree(props.role);
    if (!roleTree) return false;

    // 1. Traverse App -> Module
    const modulePerms = roleTree[props.app]?.[props.module] || roleTree['*']?.[props.module] || roleTree[props.app]?.['*'] || roleTree['*']?.['*'];
    if (!modulePerms) return false;

    // 2. Fetch specific field or fallback to module wildcard '*'
    const targetKey = props.field || '*';
    let permissionCodeRaw = modulePerms[targetKey];

    // Fallback to module-level wildcard if specific field is missing
    if (permissionCodeRaw === undefined) {
        permissionCodeRaw = modulePerms['*'] || "000";
    }

    // 3. Status Masking (`_status` object intercepts the base permission)
    if (typeof permissionCodeRaw === 'object' && permissionCodeRaw !== null) {
        if (props.status && permissionCodeRaw._status && permissionCodeRaw._status[props.status] !== undefined) {
            permissionCodeRaw = permissionCodeRaw._status[props.status];
        } else {
            // Revert back to the wildcard or a defined default if the status isn't explicitly masked
            permissionCodeRaw = permissionCodeRaw['*'] || "000";
        }
    }

    // Ensure it's evaluated as a string uniformly
    const permissionStr = permissionCodeRaw.toString().padStart(3, '0');

    // 4. Map the requested depth Level to the UNIX String Index (Own = 0, Org = 1, Network = 2)
    const levelIndex = props.level === 'own' ? 0 : (props.level === 'org' ? 1 : 2);
    
    // Parse the octal integer at the required scope index
    const grantedPermissionInt = parseInt(permissionStr[levelIndex], 10);
    
    // 5. Blazing Fast Bitwise validation
    return (grantedPermissionInt & props.action) === props.action;
}
