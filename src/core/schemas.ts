import { z } from "zod";

/**
 * 1. Localized String Schema
 * Schema per i campi testuali multi-lingua.
 * L'italiano ("it") è considerato la lingua principale ed è obbligatorio.
 * "en" e "es" sono opzionali.
 */
export const LocalizedStringSchema = z.object({
    it: z.string().min(1, "Il testo in Italiano è obbligatorio"),
    en: z.string().optional(),
    es: z.string().optional()
});

/**
 * 2. Base Schema (Livello Zod Universale)
 * Applicato a TUTTE le entità salvate nel Database.
 * Garantisce tracciabilità (chi e quando) e gestisce il Soft Delete nativo.
 */
export const BaseSchema = z.object({
    id: z.string().optional(), // opzionale in creazione, popolato in lettura/update
    orgId: z.string().readonly().optional(),
    name: LocalizedStringSchema,

    // Tracciamento
    createdAt: z.date().optional(),
    createdBy: z.string().optional(),
    updatedAt: z.date().optional(),
    updatedBy: z.string().optional(),

    // Soft Delete
    deletedAt: z.date().nullable().optional(),
    deletedBy: z.string().nullable().optional(),
});

export type LocalizedString = z.infer<typeof LocalizedStringSchema>;
export type BaseEntity = z.infer<typeof BaseSchema>;

/**
 * 3. User Schema
 * Estende il BaseSchema per gli utenti di sistema (FirebaseAuth + Firestore)
 */
export const UserSchema = BaseSchema.extend({
    email: z.string().email(),
    displayName: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    active: z.boolean().optional(),
    claims: z.record(z.string(), z.any()).optional(),
});
export type User = z.infer<typeof UserSchema>;

/**
 * 4. Organization/Entity Schema
 * Entità ombrello unificata per clienti (espositori), provider, agenzie, standisti, autonomi etc.
 */
export const OrganizationSchema = BaseSchema.extend({
    // Dati Fiscali e Fatturazione
    vatNumber: z.string().optional(),
    fiscalCode: z.string().optional(),
    sdiCode: z.string().optional(),
    iban: z.string().optional(),

    // Dati Toponomastici (via InputPlace Google API)
    fullAddress: z.string().optional(),
    address: z.string().optional(), // Via e Civico
    city: z.string().optional(),
    province: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),

    // Classificazione
    industry: z.string().optional(), // Specifico principalmente per customers
    type: z.enum([
        'customer',
        'provider',
        'manager',
        'designer',
        'carpenter',
        'builder',
        'painter',
        'technician',
        'driver',
        'promoter',
        'other'
    ]).default('other'),
    active: z.boolean().optional(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

/**
 * 5. UI Meta Forms (Bridging Zod and UI Generation)
 * Struttura per orchestrare la generazione dei form da file di configurazione TSX
 */
export type UIFieldMeta = {
    name: string; // Il path del campo (es. 'name.it' o 'vatNumber')
    label?: string; // Chiave I18n o testuale per la label
    placeholder?: string;
    type?: 'text' | 'email' | 'password' | 'number' | 'boolean' | 'select' | 'textarea' | 'localized' | 'lookup' | 'place' | 'date';
    options?: { label: string; value: string | number }[]; // Per select/radio
    lookupTarget?: string; // Es. "organizations" (Per InputLookup)
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12; // Grid support
    className?: string; // Explicit override
};
