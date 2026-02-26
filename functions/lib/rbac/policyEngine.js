"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateManifestForEntity = generateManifestForEntity;
exports.generateNavigationManifest = generateNavigationManifest;
const organization_1 = require("../schemas/organization");
const user_1 = require("../schemas/user");
const fair_1 = require("../schemas/fair");
const exhibition_1 = require("../schemas/exhibition");
const exhibitor_1 = require("../schemas/exhibitor");
const project_1 = require("../schemas/project");
const warehouse_1 = require("../schemas/warehouse");
const workcenter_1 = require("../schemas/workcenter");
const shelve_1 = require("../schemas/shelve");
const tool_1 = require("../schemas/tool");
const stand_1 = require("../schemas/stand");
const assembly_1 = require("../schemas/assembly");
const part_1 = require("../schemas/part");
const process_1 = require("../schemas/process");
const calendar_1 = require("../schemas/calendar");
const activity_1 = require("../schemas/activity");
const message_1 = require("../schemas/message");
const notification_1 = require("../schemas/notification");
const invoice_1 = require("../schemas/invoice");
const payment_1 = require("../schemas/payment");
const tax_1 = require("../schemas/tax");
const apikey_1 = require("../schemas/apikey");
const call_1 = require("../schemas/call");
const PolicyMatrices = {
    organization: organization_1.OrganizationPolicyMatrix,
    user: user_1.UserPolicyMatrix,
    fair: fair_1.FairPolicyMatrix,
    exhibition: exhibition_1.ExhibitionPolicyMatrix,
    exhibitor: exhibitor_1.ExhibitorPolicyMatrix,
    project: project_1.ProjectPolicyMatrix,
    warehouse: warehouse_1.WarehousePolicyMatrix,
    workcenter: workcenter_1.WorkcenterPolicyMatrix,
    shelve: shelve_1.ShelvePolicyMatrix,
    tool: tool_1.ToolPolicyMatrix,
    stand: stand_1.StandPolicyMatrix,
    assembly: assembly_1.AssemblyPolicyMatrix,
    part: part_1.PartPolicyMatrix,
    process: process_1.ProcessPolicyMatrix,
    calendar: calendar_1.CalendarPolicyMatrix,
    activity: activity_1.ActivityPolicyMatrix,
    message: message_1.MessagePolicyMatrix,
    notification: notification_1.NotificationPolicyMatrix,
    invoice: invoice_1.InvoicePolicyMatrix,
    payment: payment_1.PaymentPolicyMatrix,
    tax: tax_1.TaxPolicyMatrix,
    apikey: apikey_1.ApiKeyPolicyMatrix,
    call: call_1.CallPolicyMatrix,
};
/**
 * Utility to generate a dynamic UI Manifest based on a Zod Schema and the Role Policy
 */
function generateManifestForEntity(entityName, roleId, zodSchema) {
    const matrix = PolicyMatrices[entityName.toLowerCase()];
    if (!matrix) {
        throw new Error(`Policy matrix not defined for entity: ${entityName}`);
    }
    const policy = matrix[roleId] || matrix['other'];
    if (!policy.canRead) {
        return { error: "Permission Denied" };
    }
    // Extract UI Metadatas statically injected into Zod shape descriptions
    const shape = zodSchema.shape;
    const fields = [];
    // L'ordine di dichiarazione in fieldPermissions detta l'ordine della UI SDUI
    for (const key of Object.keys(policy.fieldPermissions)) {
        const fieldPolicy = policy.fieldPermissions[key];
        // If field policy is not defined or read is false, DO NOT send it to the client
        if (!fieldPolicy || !fieldPolicy.read)
            continue;
        const zodType = shape[key];
        // Se il campo è nei permessi ma manca nello Zod Schema, lo scartiamo per sicurezza
        if (!zodType)
            continue;
        // Try to parse the UI Field Meta from the custom stringified description
        let meta = {};
        if (typeof zodType.description === "string") {
            try {
                meta = JSON.parse(zodType.description);
            }
            catch (_a) {
                // Not JSON, ignore
            }
        }
        fields.push(Object.assign({ name: key, editable: policy.canUpdate && fieldPolicy.write }, meta // Inject { type: 'gallery', label: '...', etc }
        ));
    }
    return {
        entity: entityName,
        permissions: {
            canCreate: policy.canCreate,
            canRead: policy.canRead,
            canUpdate: policy.canUpdate,
            canDelete: policy.canDelete,
        },
        fields
    };
}
/**
 * Utility to generate the Navigation Sidebar config based on User Role
 */
function generateNavigationManifest(roleId) {
    switch (roleId) {
        case "customer":
            return [
                { labelKey: "dashboard", path: `/partner/${roleId}`, icon: "LayoutDashboard", matchPattern: `/partner/${roleId}/dashboard` },
                { labelKey: "orders", path: `/partner/${roleId}/orders`, icon: "FileText" },
                { labelKey: "team", path: `/partner/${roleId}/team`, icon: "UserPlus" },
                { labelKey: "settings", path: `/partner/${roleId}/settings`, icon: "Settings" }
            ];
        case "manager":
            return [
                { labelKey: "dashboard", path: `/partner/${roleId}`, icon: "LayoutDashboard", matchPattern: `/partner/${roleId}/dashboard` },
                { labelKey: "projects", path: `/partner/${roleId}/projects`, icon: "Construction" },
                { labelKey: "production", path: `/partner/${roleId}/production`, icon: "Wrench" },
                { labelKey: "customers", path: `/partner/${roleId}/customers`, icon: "Users" },
                { labelKey: "settings", path: `/partner/${roleId}/settings`, icon: "Settings" }
            ];
        case "designer":
            return [
                { labelKey: "dashboard", path: `/partner/${roleId}`, icon: "LayoutDashboard", matchPattern: `/partner/${roleId}/dashboard` },
                { labelKey: "tasks", path: `/partner/${roleId}/tasks`, icon: "PenTool" },
                { labelKey: "reviews", path: `/partner/${roleId}/reviews`, icon: "CheckSquare" }
            ];
        case "provider":
            return [
                { labelKey: "dashboard", path: `/partner/${roleId}`, icon: "LayoutDashboard", matchPattern: `/partner/${roleId}/dashboard` },
                { labelKey: "orders", path: `/partner/${roleId}/orders`, icon: "Package" },
                { labelKey: "catalog", path: `/partner/${roleId}/catalog`, icon: "Layers" },
                { labelKey: "organizations", path: `/partner/${roleId}/organizations`, icon: "Building2" },
                { labelKey: "settings", path: `/partner/${roleId}/settings`, icon: "Settings" }
            ];
        // Placeholder for other technicians/builders
        case "electrician":
        case "plumber":
        case "carpenter":
        case "standbuilder":
        case "driver":
        case "promoter":
            return [
                { labelKey: "dashboard", path: `/${roleId}`, icon: "LayoutDashboard", matchPattern: `/${roleId}/dashboard` },
                { labelKey: "tasks", path: `/${roleId}/tasks`, icon: "Wrench" },
                { labelKey: "schedule", path: `/${roleId}/schedule`, icon: "Calendar" }
            ];
        case "pending":
            return [];
        default:
            return [
                { labelKey: "dashboard", path: `/${roleId}`, icon: "LayoutDashboard", matchPattern: `/${roleId}/dashboard` },
            ];
    }
}
//# sourceMappingURL=policyEngine.js.map