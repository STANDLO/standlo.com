export function evaluateOrgUserPermissions(userClaims: Record<string, any>, orgId: string, targetUserId?: string) {
    if (!userClaims || !orgId) {
        return {
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
        };
    }

    // Must belong to the exact organization
    if (userClaims.orgId !== orgId) {
        return {
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false,
        };
    }

    // Role within the organization
    const type = userClaims.type as string;

    if (type === "ADMIN") {
        return {
            canCreate: true,
            canRead: true,
            canUpdate: true,
            canDelete: true, // Only ADMINs can suspend/delete
        };
    }

    // DESIGNER, WORKER, COLLAB can usually read staff, but cannot manage them
    return {
        canCreate: false,
        canRead: true, // They can view their colleagues
        canUpdate: targetUserId === userClaims.user_id, // Can only update themselves (if allowed by UI)
        canDelete: false,
    };
}
