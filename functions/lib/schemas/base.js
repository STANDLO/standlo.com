"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationQuerySchema = exports.ProtectedSystemFields = exports.BaseSchema = exports.DocumentMetaSchema = exports.DocumentUpdateSchema = exports.FieldUpdateSchema = exports.RoleRelationSchema = exports.CallRelationSchema = exports.ApiKeyRelationSchema = exports.TaxRelationSchema = exports.PaymentRelationSchema = exports.InvoiceRelationSchema = exports.NotificationRelationSchema = exports.MessageRelationSchema = exports.TaskRelationSchema = exports.CalendarRelationSchema = exports.ProcessRelationSchema = exports.PartRelationSchema = exports.AssemblyRelationSchema = exports.StandRelationSchema = exports.ToolRelationSchema = exports.ShelveRelationSchema = exports.WorkcenterRelationSchema = exports.WarehouseRelationSchema = exports.ExhibitorRelationSchema = exports.ExhibitionRelationSchema = exports.FairRelationSchema = exports.ProjectRelationSchema = exports.OrganizationRelationSchema = exports.UserRelationSchema = exports.LocalizedStringSchema = void 0;
exports.createCreationSchema = createCreationSchema;
exports.createUpdateSchema = createUpdateSchema;
exports.createResponseSchema = createResponseSchema;
const zod_1 = require("zod");
const primitives_1 = require("./primitives");
Object.defineProperty(exports, "LocalizedStringSchema", { enumerable: true, get: function () { return primitives_1.LocalizedStringSchema; } });
/**
 * Schemas ausiliari per la tracciabilità e i metadati avanzati
 */
exports.UserRelationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    roleId: primitives_1.RoleIdSchema
});
exports.OrganizationRelationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    vatNumber: zod_1.z.string().optional()
});
exports.ProjectRelationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    status: zod_1.z.string().optional()
});
exports.FairRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.ExhibitionRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.ExhibitorRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.WarehouseRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.WorkcenterRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.ShelveRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.ToolRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.StandRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.AssemblyRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.PartRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.ProcessRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.CalendarRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.TaskRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.MessageRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.NotificationRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.InvoiceRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.PaymentRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.TaxRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.ApiKeyRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.CallRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.RoleRelationSchema = zod_1.z.object({ id: zod_1.z.string(), name: zod_1.z.string() });
exports.FieldUpdateSchema = zod_1.z.object({
    field: zod_1.z.string(),
    oldValue: zod_1.z.unknown().optional(),
    newValue: zod_1.z.unknown().optional()
});
exports.DocumentUpdateSchema = zod_1.z.object({
    updatedBy: zod_1.z.string(),
    updatedAt: zod_1.z.date(),
    changes: zod_1.z.array(exports.FieldUpdateSchema)
});
exports.DocumentMetaSchema = zod_1.z.object({
    translations: primitives_1.LocalizedStringSchema.optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    aiVectors: zod_1.z.array(zod_1.z.number()).optional(),
}).catchall(zod_1.z.unknown());
/**
 * 2. Base Schema (Livello Zod Universale)
 * Applicato a TUTTE le entità salvate nel Database.
 * Garantisce tracciabilità (chi e quando) e gestisce il Soft Delete nativo.
 */
exports.BaseSchema = zod_1.z.object({
    // uid firestore deve sempre essere un uuid generato da backend (eccetto users/organizations/calendars che usano auth UID).
    id: zod_1.z.string().optional(),
    // orgId è obbligatorio ma generato direttamente da backend con custom claims dell'user
    orgId: zod_1.z.string().readonly().optional(),
    // name diventa input string normale opzionale in inglese (per comodità del sistema)
    name: zod_1.z.string().optional(),
    // campo code obbligatorio
    code: zod_1.z.string(),
    // aggiunto ownId da inizializzare come createdBy
    ownId: zod_1.z.string().optional(),
    // active bool (logico soft-delete state)
    active: zod_1.z.boolean().optional(),
    // version integer obbligatorio (default 1 alla creazione)
    version: zod_1.z.number().int().default(1),
    // raggruppamento per ruoli e tracciabilità utenti uniti al doc
    users: zod_1.z.array(exports.UserRelationSchema).optional(),
    // storico updates
    updates: zod_1.z.array(exports.DocumentUpdateSchema).optional(),
    // meta informazioni (translations, keywords, ai vectors)
    meta: zod_1.z.array(exports.DocumentMetaSchema).optional(),
    // Tracciamento
    createdAt: zod_1.z.date().optional(),
    createdBy: zod_1.z.string().optional(),
    updatedAt: zod_1.z.date().optional(),
    updatedBy: zod_1.z.string().optional(),
    deletedAt: zod_1.z.date().nullable().optional(),
    deletedBy: zod_1.z.string().nullable().optional(),
    // Long-Term Archiving
    isArchived: zod_1.z.boolean().default(false),
    endLifeTime: zod_1.z.date().nullable().optional(),
});
/**
 * API RBAC Schema Generators (Livello Controller)
 * Astrazioni riutilizzabili per creare automaticamente i payload di
 * Creazione, Aggiornamento, e Risposta di ogni Master Schema.
 */
// Campi Protetti (Inamovibili via API di Input)
exports.ProtectedSystemFields = {
    id: true,
    orgId: true,
    code: true,
    ownId: true,
    users: true,
    updates: true,
    version: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
    deletedAt: true,
    deletedBy: true,
    isArchived: true,
    endLifeTime: true,
};
// Paginazione Standard (GET)
exports.PaginationQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    offset: zod_1.z.coerce.number().int().min(0).default(0),
    cursor: zod_1.z.string().optional(),
    orderBy: zod_1.z.string().optional(),
    orderDirection: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// Generatori Dinamici (Typescript + Zod Factory)
/** Genera lo schema per la creazione omettendo automaticamente i system fields */
function createCreationSchema(schema) {
    return schema.omit(exports.ProtectedSystemFields);
}
/** Genera lo schema per l'aggiornamento (tutto opzionale, no system fields) */
function createUpdateSchema(schema) {
    return schema.omit(exports.ProtectedSystemFields).partial();
}
/** Genera la risposta standard API per il Master Schema richiesto */
function createResponseSchema(schema) {
    return zod_1.z.object({
        data: zod_1.z.array(schema),
        meta: zod_1.z.object({
            totalCount: zod_1.z.number().int().optional(),
            nextCursor: zod_1.z.string().optional(),
        }).optional(),
    });
}
//# sourceMappingURL=base.js.map