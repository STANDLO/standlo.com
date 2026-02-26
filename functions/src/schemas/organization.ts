import { z } from "zod";
import { createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleIdSchema, RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";

// Roles for standard dynamic Select mapping
const RoleOptions = [
    { value: "customer", label: "Customer" },
    { value: "provider", label: "Material Provider" },
    // 1. Fase di Progettazione e Permessi (Planning)
    { value: "manager", label: "Project Manager" },
    { value: "architect", label: "Architect" },
    { value: "engineer", label: "Engineer" },
    { value: "designer", label: "Designer" },
    // TECHNICIAN
    { value: "electrician", label: "Electrician" },
    { value: "plumber", label: "Plumber" },
    // WOOD
    { value: "carpenter", label: "Carpenter" },
    { value: "cabinetmaker", label: "Cabinetmaker" },
    // DRYWALL
    { value: "dryliner", label: "Dryliner" },
    // IRON
    { value: "ironworker", label: "Ironworker" },
    // GLASS
    { value: "windowfitter", label: "Window Fitter" },
    { value: "glazier", label: "Glazier" },
    // EXPO
    { value: "riggers", label: "Riggers" },
    { value: "standbuilder", label: "Stand Builder" },
    // FINISHING
    { value: "plasterer", label: "Plasterer" },
    { value: "painter", label: "Painter" },
    { value: "tiler", label: "Tiler" },
    // LOGISTICS
    { value: "driver", label: "Driver" },
    { value: "forkliftdriver", label: "Forklift Driver" },
    // OTHER
    { value: "promoter", label: "Promoter" }
];

export const OrganizationSchema = z.object({
    id: z.string().optional(),
    roleId: RoleIdSchema.describe(JSON.stringify({ type: "select", required: true, label: "Ruolo in STANDLO", options: RoleOptions })),
    vatNumber: z.string().optional().describe(JSON.stringify({ type: "vat", required: true, label: "Partita IVA / Codice Fiscale" })),
    name: z.string().min(1, "Il nome dell'Organizzazione è obbligatorio.").describe(JSON.stringify({ type: "text", required: true, label: "Ragione Sociale o Nome Visualizzato" })),
    code: z.string().optional(),
    pec: z.string().email("PEC non valida.").optional(),
    sdiCode: z.string().length(7, "Il Codice SDI deve essere di 7 caratteri.").optional(),

    place: z.object({
        fullAddress: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        googlePlaceId: z.string().optional(),
        coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
    }).optional().describe(JSON.stringify({ type: "place", required: true, label: "Sede Operativa" })),

    phone: z.string().optional(),
    email: z.string().email("Formato email non valido.").optional(),
    website: z.string().url("URL sito web non valido.").optional(),
    logoUrl: z.string().optional().describe(JSON.stringify({ type: "gallery", label: "Logo Aziendale" })),
    logoUrls: z.array(z.string()).optional(),

    active: z.boolean().default(true),
    createdAt: z.any().optional(),
    createdBy: z.string().optional(),
    updatedAt: z.any().optional(),
    updatedBy: z.string().optional()
});

export type Organization = z.infer<typeof OrganizationSchema>;

export const OrganizationCreateSchema = createCreationSchema(OrganizationSchema);
export const OrganizationUpdateSchema = createUpdateSchema(OrganizationSchema);
export const OrganizationSearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
    roleId: z.string().optional(),
    vatNumber: z.string().optional(),
});

// -- RBAC Policy Matrix per Organization --
export const OrganizationPolicyMatrix: Record<RoleId, EntityPolicy> = {
    // MANAGER has full control over their own organization
    manager: {
        canCreate: false, // Managers don't create the org, they onboard into it
        canRead: true,
        canUpdate: true,
        canDelete: false,
        fieldPermissions: {
            name: { read: true, write: true },
            vatNumber: { read: true, write: true },
            pec: { read: true, write: true },
            sdiCode: { read: true, write: true },
            place: { read: true, write: true },
            phone: { read: true, write: true },
            email: { read: true, write: true },
            website: { read: true, write: true },
            logoUrl: { read: true, write: true },
            logoUrls: { read: true, write: true },
            roleId: { read: true, write: false }, // Generalmente non modificabile da UI post-onboarding
        }
    },
    // DESIGNER has read-only access to standard fields, cannot edit org settings
    designer: {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        fieldPermissions: {
            name: { read: true, write: false },
            vatNumber: { read: false, write: false }, // Masked for designers
            pec: { read: false, write: false },       // Masked for designers
            sdiCode: { read: false, write: false },   // Masked for designers
            address: { read: true, write: false },
            googlePlaceId: { read: true, write: false },
            coordinates: { read: true, write: false },
            phone: { read: true, write: false },
            email: { read: true, write: false },
            website: { read: true, write: false },
            logoUrl: { read: true, write: false },
            logoUrls: { read: true, write: false },
        }
    },
    // CUSTOMER has restricted vision
    customer: {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        fieldPermissions: {
            name: { read: true, write: false },
            vatNumber: { read: false, write: false },
            pec: { read: false, write: false },
            sdiCode: { read: false, write: false },
            address: { read: true, write: false },
            googlePlaceId: { read: true, write: false },
            coordinates: { read: true, write: false },
            phone: { read: true, write: false },
            email: { read: true, write: false },
            website: { read: true, write: false },
            logoUrl: { read: true, write: false },
            logoUrls: { read: true, write: false },
        }
    },
    // PENDING role for Onboarding
    pending: {
        canCreate: true, // Used effectively during onboarding
        canRead: true,
        canUpdate: true,
        canDelete: false,
        fieldPermissions: {
            // L'ordine qui definisce l'ordine di rendering nella UI!
            roleId: { read: true, write: true },
            vatNumber: { read: true, write: true },
            name: { read: true, write: true },
            place: { read: true, write: true },
            logoUrl: { read: true, write: true },
        }
    },
    // Same default strict read-only for others...
    architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    engineer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    electrician: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plumber: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    carpenter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    cabinetmaker: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    ironworker: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    windowfitter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    glazier: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    riggers: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standbuilder: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plasterer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    painter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    tiler: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    driver: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    forkliftdriver: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    promoter: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    other: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
};
