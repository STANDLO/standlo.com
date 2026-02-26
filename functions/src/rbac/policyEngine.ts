import { z } from "zod";
import { RoleId } from "../schemas/auth";
import { EntityPolicy } from "./core";

import { OrganizationPolicyMatrix } from "../schemas/organization";
import { UserPolicyMatrix } from "../schemas/user";
import { FairPolicyMatrix } from "../schemas/fair";
import { ExhibitionPolicyMatrix } from "../schemas/exhibition";
import { ExhibitorPolicyMatrix } from "../schemas/exhibitor";
import { ProjectPolicyMatrix } from "../schemas/project";
import { WarehousePolicyMatrix } from "../schemas/warehouse";
import { WorkcenterPolicyMatrix } from "../schemas/workcenter";
import { ShelvePolicyMatrix } from "../schemas/shelve";
import { ToolPolicyMatrix } from "../schemas/tool";
import { StandPolicyMatrix } from "../schemas/stand";
import { AssemblyPolicyMatrix } from "../schemas/assembly";
import { PartPolicyMatrix } from "../schemas/part";
import { ProcessPolicyMatrix } from "../schemas/process";
import { CalendarPolicyMatrix } from "../schemas/calendar";
import { ActivityPolicyMatrix } from "../schemas/activity";
import { MessagePolicyMatrix } from "../schemas/message";
import { NotificationPolicyMatrix } from "../schemas/notification";
import { InvoicePolicyMatrix } from "../schemas/invoice";
import { PaymentPolicyMatrix } from "../schemas/payment";
import { TaxPolicyMatrix } from "../schemas/tax";
import { ApiKeyPolicyMatrix } from "../schemas/apikey";
import { CallPolicyMatrix } from "../schemas/call";

const PolicyMatrices: Record<string, Record<RoleId, EntityPolicy>> = {
    organization: OrganizationPolicyMatrix,
    user: UserPolicyMatrix,
    fair: FairPolicyMatrix,
    exhibition: ExhibitionPolicyMatrix,
    exhibitor: ExhibitorPolicyMatrix,
    project: ProjectPolicyMatrix,
    warehouse: WarehousePolicyMatrix,
    workcenter: WorkcenterPolicyMatrix,
    shelve: ShelvePolicyMatrix,
    tool: ToolPolicyMatrix,
    stand: StandPolicyMatrix,
    assembly: AssemblyPolicyMatrix,
    part: PartPolicyMatrix,
    process: ProcessPolicyMatrix,
    calendar: CalendarPolicyMatrix,
    activity: ActivityPolicyMatrix,
    message: MessagePolicyMatrix,
    notification: NotificationPolicyMatrix,
    invoice: InvoicePolicyMatrix,
    payment: PaymentPolicyMatrix,
    tax: TaxPolicyMatrix,
    apikey: ApiKeyPolicyMatrix,
    call: CallPolicyMatrix,
};

/**
 * Utility to generate a dynamic UI Manifest based on a Zod Schema and the Role Policy
 */
export function generateManifestForEntity(entityName: string, roleId: RoleId, zodSchema: z.ZodObject<z.ZodRawShape>) {
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
        if (!fieldPolicy || !fieldPolicy.read) continue;

        const zodType = shape[key] as unknown as Record<string, unknown>;
        // Se il campo è nei permessi ma manca nello Zod Schema, lo scartiamo per sicurezza
        if (!zodType) continue;

        // Try to parse the UI Field Meta from the custom stringified description
        let meta = {};
        if (typeof zodType.description === "string") {
            try {
                meta = JSON.parse(zodType.description);
            } catch {
                // Not JSON, ignore
            }
        }

        fields.push({
            name: key,
            editable: policy.canUpdate && fieldPolicy.write, // Must have entity update permission AND field write permission
            ...meta // Inject { type: 'gallery', label: '...', etc }
        });
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

export interface NavItemManifest {
    labelKey: string;     // Translation key (e.g., 'dashboard')
    path: string;         // Relative URL path without locale (e.g., '/manager/projects')
    icon: string;         // Lucide Icon name (e.g., 'LayoutDashboard')
    matchPattern?: string; // Optional exact match pattern for active state
}

/**
 * Utility to generate the Navigation Sidebar config based on User Role
 */
export function generateNavigationManifest(roleId: RoleId): NavItemManifest[] {
    switch (roleId) {
        case "customer":
            return [
                { labelKey: "dashboard", path: `/${roleId}`, icon: "LayoutDashboard", matchPattern: `/${roleId}/dashboard` },
                { labelKey: "orders", path: `/${roleId}/orders`, icon: "FileText" },
                { labelKey: "team", path: `/${roleId}/team`, icon: "UserPlus" },
                { labelKey: "settings", path: `/${roleId}/settings`, icon: "Settings" }
            ];
        case "manager":
            return [
                { labelKey: "dashboard", path: `/${roleId}`, icon: "LayoutDashboard", matchPattern: `/${roleId}/dashboard` },
                { labelKey: "projects", path: `/${roleId}/projects`, icon: "Construction" },
                { labelKey: "production", path: `/${roleId}/production`, icon: "Wrench" },
                { labelKey: "customers", path: `/${roleId}/customers`, icon: "Users" },
                { labelKey: "settings", path: `/${roleId}/settings`, icon: "Settings" }
            ];
        case "designer":
            return [
                { labelKey: "dashboard", path: `/${roleId}`, icon: "LayoutDashboard", matchPattern: `/${roleId}/dashboard` },
                { labelKey: "tasks", path: `/${roleId}/tasks`, icon: "PenTool" },
                { labelKey: "reviews", path: `/${roleId}/reviews`, icon: "CheckSquare" }
            ];
        case "provider":
            return [
                { labelKey: "dashboard", path: `/${roleId}`, icon: "LayoutDashboard", matchPattern: `/${roleId}/dashboard` },
                { labelKey: "orders", path: `/${roleId}/orders`, icon: "Package" },
                { labelKey: "catalog", path: `/${roleId}/catalog`, icon: "Layers" },
                { labelKey: "organizations", path: `/${roleId}/organizations`, icon: "Building2" },
                { labelKey: "settings", path: `/${roleId}/settings`, icon: "Settings" }
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

