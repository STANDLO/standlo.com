"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Registry = void 0;
exports.getEntityConfig = getEntityConfig;
exports.buildCollectionPath = buildCollectionPath;
const schemas = __importStar(require("../schemas"));
exports.Registry = {
    // Global Elements
    organization: { scope: "global", name: "organizations", schema: schemas.OrganizationSchema },
    user: { scope: "global", name: "users", schema: schemas.UserSchema },
    auth: { scope: "global", name: "auth", schema: schemas.AuthEventSchema },
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
function getEntityConfig(entityId) {
    const config = exports.Registry[entityId];
    if (!config) {
        throw new Error(`[EntityRegistry] Entity ID '${entityId}' not found.`);
    }
    return config;
}
function buildCollectionPath(entityId, orgId) {
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
//# sourceMappingURL=entityRegistry.js.map