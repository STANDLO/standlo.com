export interface GatewayRequest {
    correlationId?: string;
    idempotencyKey?: string;
    orgId?: string;
    userId?: string;
    roleId?: string;
    entityId?: string;
    actionId: string;
    payload?: Record<string, unknown>;
}
