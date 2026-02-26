import { z } from "zod";
import * as schemas from "../schemas";

export type PathScope = "global" | "tenant";

export interface EntityConfig {
    scope: PathScope;
    name: string; // Custom firestore collection name
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    schema: z.ZodSchema<any>;
}

export const Registry: Record<string, EntityConfig> = {
    // Global Elements
    "organization": { scope: "global", name: "organizations", schema: schemas.OrganizationSchema },
    "user": { scope: "global", name: "users", schema: schemas.UserSchema },

    // Multi-tenant Elements
    "fair": { scope: "tenant", name: "fairs", schema: schemas.FairSchema },
    "exhibition": { scope: "tenant", name: "exhibitions", schema: schemas.ExhibitionSchema },
    "exhibitor": { scope: "tenant", name: "exhibitors", schema: schemas.ExhibitorSchema },
    "project": { scope: "tenant", name: "projects", schema: schemas.ProjectSchema },
    "warehouse": { scope: "tenant", name: "warehouses", schema: schemas.WarehouseSchema },
    "workcenter": { scope: "tenant", name: "workcenters", schema: schemas.WorkcenterSchema },
    "shelve": { scope: "tenant", name: "shelves", schema: schemas.ShelveSchema },
    "tool": { scope: "tenant", name: "tools", schema: schemas.ToolSchema },
    "stand": { scope: "tenant", name: "stands", schema: schemas.StandSchema },
    "assembly": { scope: "tenant", name: "assemblies", schema: schemas.AssemblySchema },
    "part": { scope: "tenant", name: "parts", schema: schemas.PartSchema },
    "process": { scope: "tenant", name: "processes", schema: schemas.ProcessSchema },
    "calendar": { scope: "tenant", name: "calendars", schema: schemas.CalendarSchema },
    "activity": { scope: "tenant", name: "activities", schema: schemas.ActivitySchema },
    "message": { scope: "tenant", name: "messages", schema: schemas.MessageSchema },
    "notification": { scope: "tenant", name: "notifications", schema: schemas.NotificationSchema },
    "invoice": { scope: "tenant", name: "invoices", schema: schemas.InvoiceSchema },
    "payment": { scope: "tenant", name: "payments", schema: schemas.PaymentSchema },
    "tax": { scope: "tenant", name: "taxes", schema: schemas.TaxSchema },
    "apikey": { scope: "tenant", name: "apikeys", schema: schemas.ApiKeySchema },
    "call": { scope: "tenant", name: "calls", schema: schemas.CallSchema },
};

export function getEntityConfig(entityId: string): EntityConfig {
    const config = Registry[entityId];
    if (!config) {
        throw new Error(`[EntityRegistry] Entity ID '${entityId}' not found.`);
    }
    return config;
}

export function buildCollectionPath(entityId: string, orgId?: string): string {
    const config = getEntityConfig(entityId);

    if (config.scope === "global") {
        return config.name;
    }

    if (config.scope === "tenant") {
        if (!orgId) {
            throw new Error(`[EntityRegistry] orgId is REQUIRED to access tenant-scoped entity '${entityId}'.`);
        }
        return `organizations/${orgId}/${config.name}`;
    }

    throw new Error(`[EntityRegistry] Invalid scope for entity '${entityId}'.`);
}
