"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlertSchema = void 0;
const zod_1 = require("zod");
exports.AlertSchema = zod_1.z.object({
    id: zod_1.z.string().describe(JSON.stringify({ type: "hidden" })),
    orgId: zod_1.z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "Organization ID",
        readonly: true,
    })),
    uid: zod_1.z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "User UID",
        readonly: true,
    })),
    email: zod_1.z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "User Email",
        readonly: true,
    })),
    roleId: zod_1.z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "User Role",
        readonly: true,
    })),
    type: zod_1.z.enum(["security", "system"]).describe(JSON.stringify({
        type: "enum",
        label: "Alert Type",
        options: [
            { label: "Security", value: "security" },
            { label: "System", value: "system" },
        ],
        readonly: true,
    })),
    action: zod_1.z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "Gateway Action",
        readonly: true,
    })),
    entityId: zod_1.z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "Target Entity",
        readonly: true,
    })),
    payload: zod_1.z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "Request Payload",
        readonly: true,
    })),
    errorMessage: zod_1.z.string().describe(JSON.stringify({
        type: "text",
        label: "Error Message",
        readonly: true,
    })),
    errorReferenceCode: zod_1.z.string().describe(JSON.stringify({
        type: "string",
        label: "Error Reference Code",
        readonly: true,
    })),
    userAgent: zod_1.z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "User Agent",
        readonly: true,
    })),
    ipAddress: zod_1.z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "IP Address",
        readonly: true,
    })),
    isArchived: zod_1.z.boolean().default(false).describe(JSON.stringify({ type: "hidden" })),
    endLifeTime: zod_1.z.number().optional().describe(JSON.stringify({ type: "hidden" })),
    createdAt: zod_1.z.number().describe(JSON.stringify({ type: "hidden" })),
    createdBy: zod_1.z.string().describe(JSON.stringify({ type: "hidden" })),
    updatedAt: zod_1.z.number().describe(JSON.stringify({ type: "hidden" })),
    updatedBy: zod_1.z.string().describe(JSON.stringify({ type: "hidden" })),
    deletedAt: zod_1.z.number().optional().describe(JSON.stringify({ type: "hidden" })),
    deletedBy: zod_1.z.string().optional().describe(JSON.stringify({ type: "hidden" })),
}).describe("Security and System Alerts");
//# sourceMappingURL=alert.js.map