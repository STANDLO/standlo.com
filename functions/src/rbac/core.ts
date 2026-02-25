

/**
 * Defines which fields are readable and editable for a specific role
 * on a specific entity (e.g. Organization)
 */
export interface EntityPolicy {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    // Map of fields and what the role can do with them
    fieldPermissions: Record<string, { read: boolean; write: boolean }>;
}
