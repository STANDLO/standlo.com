import { z } from "zod";
import { RoleIdSchema, LocalizedStringSchema } from "./primitives";

export { LocalizedStringSchema };
/**
 * Schemas ausiliari per la tracciabilità e i metadati avanzati
 */
export const UserRelationSchema = z.object({
    id: z.string(),
    name: z.string(),
    roleId: RoleIdSchema
});
export type UserRelation = z.infer<typeof UserRelationSchema>;

export const OrganizationRelationSchema = z.object({
    id: z.string(),
    name: z.string(),
    vatNumber: z.string().optional()
});
export type OrganizationRelation = z.infer<typeof OrganizationRelationSchema>;

export const ProjectRelationSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.string().optional()
});
export type ProjectRelation = z.infer<typeof ProjectRelationSchema>;

export const FairRelationSchema = z.object({ id: z.string(), name: z.string() });
export type FairRelation = z.infer<typeof FairRelationSchema>;

export const ExhibitionRelationSchema = z.object({ id: z.string(), name: z.string() });
export type ExhibitionRelation = z.infer<typeof ExhibitionRelationSchema>;

export const ExhibitorRelationSchema = z.object({ id: z.string(), name: z.string() });
export type ExhibitorRelation = z.infer<typeof ExhibitorRelationSchema>;

export const WarehouseRelationSchema = z.object({ id: z.string(), name: z.string() });
export type WarehouseRelation = z.infer<typeof WarehouseRelationSchema>;

export const WorkcenterRelationSchema = z.object({ id: z.string(), name: z.string() });
export type WorkcenterRelation = z.infer<typeof WorkcenterRelationSchema>;

export const ShelveRelationSchema = z.object({ id: z.string(), name: z.string() });
export type ShelveRelation = z.infer<typeof ShelveRelationSchema>;

export const ToolRelationSchema = z.object({ id: z.string(), name: z.string() });
export type ToolRelation = z.infer<typeof ToolRelationSchema>;

export const StandRelationSchema = z.object({ id: z.string(), name: z.string() });
export type StandRelation = z.infer<typeof StandRelationSchema>;

export const AssemblyRelationSchema = z.object({ id: z.string(), name: z.string() });
export type AssemblyRelation = z.infer<typeof AssemblyRelationSchema>;

export const PartRelationSchema = z.object({ id: z.string(), name: z.string() });
export type PartRelation = z.infer<typeof PartRelationSchema>;

export const ProcessRelationSchema = z.object({ id: z.string(), name: z.string() });
export type ProcessRelation = z.infer<typeof ProcessRelationSchema>;

export const CalendarRelationSchema = z.object({ id: z.string(), name: z.string() });
export type CalendarRelation = z.infer<typeof CalendarRelationSchema>;

export const ActivityRelationSchema = z.object({ id: z.string(), name: z.string() });
export type ActivityRelation = z.infer<typeof ActivityRelationSchema>;

export const MessageRelationSchema = z.object({ id: z.string(), name: z.string() });
export type MessageRelation = z.infer<typeof MessageRelationSchema>;

export const NotificationRelationSchema = z.object({ id: z.string(), name: z.string() });
export type NotificationRelation = z.infer<typeof NotificationRelationSchema>;

export const InvoiceRelationSchema = z.object({ id: z.string(), name: z.string() });
export type InvoiceRelation = z.infer<typeof InvoiceRelationSchema>;

export const PaymentRelationSchema = z.object({ id: z.string(), name: z.string() });
export type PaymentRelation = z.infer<typeof PaymentRelationSchema>;

export const TaxRelationSchema = z.object({ id: z.string(), name: z.string() });
export type TaxRelation = z.infer<typeof TaxRelationSchema>;

export const ApiKeyRelationSchema = z.object({ id: z.string(), name: z.string() });
export type ApiKeyRelation = z.infer<typeof ApiKeyRelationSchema>;

export const CallRelationSchema = z.object({ id: z.string(), name: z.string() });
export type CallRelation = z.infer<typeof CallRelationSchema>;

export const RoleRelationSchema = z.object({ id: z.string(), name: z.string() });
export type RoleRelation = z.infer<typeof RoleRelationSchema>;

export const FieldUpdateSchema = z.object({
    field: z.string(),
    oldValue: z.unknown().optional(),
    newValue: z.unknown().optional()
});

export const DocumentUpdateSchema = z.object({
    updatedBy: z.string(),
    updatedAt: z.date(),
    changes: z.array(FieldUpdateSchema)
});

export const DocumentMetaSchema = z.object({
    translations: LocalizedStringSchema.optional(),
    keywords: z.array(z.string()).optional(),
    aiVectors: z.array(z.number()).optional(),
}).catchall(z.unknown());

/**
 * 2. Base Schema (Livello Zod Universale)
 * Applicato a TUTTE le entità salvate nel Database.
 * Garantisce tracciabilità (chi e quando) e gestisce il Soft Delete nativo.
 */
export const BaseSchema = z.object({
    // uid firestore deve sempre essere un uuid generato da backend (eccetto users/organizations/calendars che usano auth UID).
    id: z.string().optional(),
    // orgId è obbligatorio ma generato direttamente da backend con custom claims dell'user
    orgId: z.string().readonly().optional(),

    // name diventa input string normale opzionale in inglese (per comodità del sistema)
    name: z.string().optional(),
    // campo code obbligatorio
    code: z.string(),
    // aggiunto ownId da inizializzare come createdBy
    ownId: z.string().optional(),

    // active bool (logico soft-delete state)
    active: z.boolean().optional(),

    // version integer obbligatorio (default 1 alla creazione)
    version: z.number().int().default(1),

    // raggruppamento per ruoli e tracciabilità utenti uniti al doc
    users: z.array(UserRelationSchema).optional(),

    // storico updates
    updates: z.array(DocumentUpdateSchema).optional(),

    // meta informazioni (translations, keywords, ai vectors)
    meta: z.array(DocumentMetaSchema).optional(),

    // Tracciamento
    createdAt: z.date().optional(),
    createdBy: z.string().optional(),
    updatedAt: z.date().optional(),
    updatedBy: z.string().optional(),
    deletedAt: z.date().nullable().optional(),
    deletedBy: z.string().nullable().optional(),

});

export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
export type BaseEntity = z.infer<typeof BaseSchema>;

/**
 * API RBAC Schema Generators (Livello Controller)
 * Astrazioni riutilizzabili per creare automaticamente i payload di
 * Creazione, Aggiornamento, e Risposta di ogni Master Schema.
 */

// Campi Protetti (Inamovibili via API di Input)
export const ProtectedSystemFields = {
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
} as const;

// Paginazione Standard (GET)
export const PaginationQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    cursor: z.string().optional(),
    orderBy: z.string().optional(),
    orderDirection: z.enum(['asc', 'desc']).default('desc'),
});

// Generatori Dinamici (Typescript + Zod Factory)

/** Genera lo schema per la creazione omettendo automaticamente i system fields */
export function createCreationSchema<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
    return schema.omit(ProtectedSystemFields);
}

/** Genera lo schema per l'aggiornamento (tutto opzionale, no system fields) */
export function createUpdateSchema<T extends z.ZodObject<z.ZodRawShape>>(schema: T) {
    return schema.omit(ProtectedSystemFields).partial();
}

/** Genera la risposta standard API per il Master Schema richiesto */
export function createResponseSchema<T extends z.ZodTypeAny>(schema: T) {
    return z.object({
        data: z.array(schema),
        meta: z.object({
            totalCount: z.number().int().optional(),
            nextCursor: z.string().optional(),
        }).optional(),
    });
}
