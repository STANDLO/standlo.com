import { z } from "zod";

export const AlertSchema = z.object({
    id: z.string().describe(JSON.stringify({ type: "hidden" })),

    orgId: z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "Organization ID",
        readonly: true,
    })),

    uid: z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "User UID",
        readonly: true,
    })),

    email: z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "User Email",
        readonly: true,
    })),

    roleId: z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "User Role",
        readonly: true,
    })),

    type: z.enum(["security", "system"]).describe(JSON.stringify({
        type: "enum",
        label: "Alert Type",
        options: [
            { label: "Security", value: "security" },
            { label: "System", value: "system" },
        ],
        readonly: true,
    })),

    action: z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "Gateway Action",
        readonly: true,
    })),

    entityId: z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "Target Entity",
        readonly: true,
    })),

    payload: z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "Request Payload",
        readonly: true,
    })),

    errorMessage: z.string().describe(JSON.stringify({
        type: "text",
        label: "Error Message",
        readonly: true,
    })),

    errorReferenceCode: z.string().describe(JSON.stringify({
        type: "string",
        label: "Error Reference Code",
        readonly: true,
    })),

    userAgent: z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "User Agent",
        readonly: true,
    })),

    ipAddress: z.string().optional().describe(JSON.stringify({
        type: "string",
        label: "IP Address",
        readonly: true,
    })),

    isArchived: z.boolean().default(false).describe(JSON.stringify({ type: "hidden" })),
    endLifeTime: z.number().optional().describe(JSON.stringify({ type: "hidden" })),

    createdAt: z.number().describe(JSON.stringify({ type: "hidden" })),
    createdBy: z.string().describe(JSON.stringify({ type: "hidden" })),
    updatedAt: z.number().describe(JSON.stringify({ type: "hidden" })),
    updatedBy: z.string().describe(JSON.stringify({ type: "hidden" })),
    deletedAt: z.number().optional().describe(JSON.stringify({ type: "hidden" })),
    deletedBy: z.string().optional().describe(JSON.stringify({ type: "hidden" })),
}).describe("Security and System Alerts");

export type Alert = z.infer<typeof AlertSchema>;
