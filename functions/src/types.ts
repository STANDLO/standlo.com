export interface GatewayFilter {
    field: string;
    op: "==" | "<" | "<=" | ">" | ">=" | "array-contains" | "in" | "array-contains-any" | "not-in" | "!=";
    value: unknown;
}

export interface GatewayOrder {
    field: string;
    direction: "asc" | "desc";
}

export interface GatewayRequest {
    correlationId?: string;
    idempotencyKey?: string; // Must Have for transactional safety
    orgId?: string;
    userId?: string;
    roleId?: string;
    entityId: string;        // Made required for Gateway logic
    actionId: string;
    payload?: Record<string, unknown>; // Required for create/update

    // Pagination & Search properties
    limit?: number;
    cursor?: unknown; // startAfter document snapshot ID or value
    orderBy?: GatewayOrder[];
    filters?: GatewayFilter[];
}
