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
    organization: { scope: "global", name: "organizations", schema: schemas.OrganizationSchema },
    organizationUser: { scope: "tenant", name: "users", schema: schemas.UserSchema },
    user: { scope: "global", name: "users", schema: schemas.UserSchema },
    auth: { scope: "global", name: "auths", schema: schemas.AuthEventSchema },
    place: { scope: "global", name: "places", schema: schemas.PlaceSchema },

    // Multi-tenant Elements
    fair: { scope: "global", name: "fairs", schema: schemas.FairSchema },
    exhibition: { scope: "global", name: "exhibitions", schema: schemas.ExhibitionSchema },
    exhibitor: { scope: "global", name: "exhibitors", schema: schemas.ExhibitorSchema },
    project: { scope: "tenant", name: "projects", schema: schemas.ProjectSchema },
    warehouse: { scope: "tenant", name: "warehouses", schema: schemas.WarehouseSchema },
    workcenter: { scope: "tenant", name: "workcenters", schema: schemas.WorkcenterSchema },
    shelve: { scope: "tenant", name: "shelves", schema: schemas.ShelveSchema },
    tool: { scope: "global", name: "tools", schema: schemas.ToolSchema },
    stand: { scope: "global", name: "stands", schema: schemas.StandSchema },
    build: { scope: "global", name: "builds", schema: schemas.BuildSchema },
    emergency: { scope: "global", name: "emergencies", schema: schemas.EmergencySchema },
    assembly: { scope: "global", name: "assemblies", schema: schemas.AssemblySchema },
    part: { scope: "global", name: "parts", schema: schemas.PartSchema },
    process: { scope: "global", name: "processes", schema: schemas.ProcessSchema },
    calendar: { scope: "tenant", name: "calendars", schema: schemas.CalendarSlotSchema },
    task: { scope: "tenant", name: "tasks", schema: schemas.TaskSchema },
    rent: { scope: "tenant", name: "rents", schema: schemas.RentSchema },
    message: { scope: "tenant", name: "messages", schema: schemas.MessageSchema },
    notification: { scope: "tenant", name: "notifications", schema: schemas.NotificationSchema },
    invoice: { scope: "tenant", name: "invoices", schema: schemas.InvoiceSchema },
    payment: { scope: "tenant", name: "payments", schema: schemas.PaymentSchema },
    tax: { scope: "tenant", name: "taxes", schema: schemas.TaxSchema },
    apikey: { scope: "tenant", name: "apikeys", schema: schemas.ApiKeySchema },
    call: { scope: "global", name: "apicalls", schema: schemas.CallSchema },
    alert: { scope: "global", name: "admin/security/alerts", schema: schemas.AlertSchema },
    product: { scope: "tenant", name: "products", schema: schemas.ProductSchema },
    canvas: { scope: "global", name: "canvases", schema: schemas.CanvasSchema },
    material: { scope: "global", name: "materials", schema: schemas.MaterialSchema },
    texture: { scope: "global", name: "textures", schema: schemas.TextureSchema },
    mesh: { scope: "global", name: "meshes", schema: schemas.MeshSchema },
    bundle: { scope: "global", name: "bundles", schema: schemas.BundleSchema },
    pipeline: { scope: "global", name: "pipelines", schema: schemas.PipelineSchema },
    pipeline_execution: { scope: "global", name: "pipelines_executions", schema: schemas.PipelineExecutionSchema },
    ai_skill: { scope: "global", name: "ai_skills", schema: schemas.AISkillSchema },
};

export function getEntityConfig(entityId: string): EntityConfig {
    const config = Registry[entityId];
    if (!config) {
        throw new Error(`[EntityRegistry] Entity ID '${entityId}' not found.`);
    }
    return config;
}

export function buildCollectionPath(entityId: string, orgId?: string): string {
    const parts = entityId.split("/");
    const rootEntity = parts[0];
    const config = getEntityConfig(rootEntity);

    let basePath = "";
    if (config.scope === "global") {
        basePath = config.name;
    } else if (config.scope === "tenant") {
        if (!orgId) {
            throw new Error(`[EntityRegistry] orgId is REQUIRED to access tenant-scoped entity '${rootEntity}'.`);
        }
        basePath = `organizations/${orgId}/${config.name}`;
    } else {
        throw new Error(`[EntityRegistry] Invalid scope for entity '${rootEntity}'.`);
    }

    if (parts.length === 3) {
        // e.g., "canvas/id/objects" -> "canvases/id/objects"
        return `${basePath}/${parts[1]}/${parts[2]}`;
    }

    return basePath;
}
