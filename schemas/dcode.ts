import { z } from "zod";
import { DbSchema } from "./db";

/**
 * Filter and Order Types identifying query structures on the Gateway
 */
export const GatewayFilterSchema = z.object({
  field: z.string(),
  operator: z.enum(["==", "!=", ">", "<", ">=", "<=", "in", "not-in", "array-contains", "array-contains-any"]),
  value: z.any()
});

export const GatewayOrderSchema = z.object({
  field: z.string(),
  direction: z.enum(["asc", "desc"])
});

export type GatewayFilter = z.infer<typeof GatewayFilterSchema>;
export type GatewayOrder = z.infer<typeof GatewayOrderSchema>;

/**
 * The Monolithic DCODE API Payload Contract (Schema-First Gateway)
 */
export const DcodeRequestSchema = z.object({
  correlationId: z.string().uuid().optional(),
  idempotencyKey: z.string().optional(),
  orgId: z.string().optional(),
  userId: z.string().optional(),
  roleId: z.string().optional(),
  
  // The vital DCODE identifiers translating `@entityId #actionId`
  moduleId: z.string().describe("Root module name, e.g. 'design', 'object', 'auth'"),
  actionId: z.string().describe("Action to perform, e.g. 'create', 'update_object', 'run_pipeline'"),
  entityId: z.string().describe("Target UUID, or 'new' if creating"),
  
  // Optional Payload - Content will be dynamically validated by the server against the imported module Zod schema
  payload: z.record(z.string(), z.any()).optional(),
  
  // Explicit async mode
  async: z.boolean().optional().describe("If true, bypasses Sync CRUD and fires to CloudTasks"),
  
  // Query Modifiers
  limit: z.number().int().positive().optional(),
  cursor: z.any().optional(),
  orderBy: z.array(GatewayOrderSchema).optional(),
  filters: z.array(GatewayFilterSchema).optional()
});

export type DcodeRequest = z.infer<typeof DcodeRequestSchema>;

/**
 * DcodeDbSchema: Automatic Auditing Log Structure
 * Stored in /dcodes/[uuid] to track every single API request
 */
export const DcodeDbSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.number(),
  requestPayload: DcodeRequestSchema,
  rbacVerified: z.boolean(),
  asyncFired: z.boolean(),
  responseStatus: z.number(),
  errorLog: z.string().optional(),
});

export type DcodeDb = z.infer<typeof DcodeDbSchema>;

export const GatewayFilterDbSchema = DbSchema.merge(GatewayFilterSchema);
export type GatewayFilterDbEntity = z.infer<typeof GatewayFilterDbSchema>;
