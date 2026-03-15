import { DbSchema } from "./db";
import { z } from "zod";

import { RoleIdSchema, RoleId } from "./auth";
import rolesJson from "./roles.json";

export const SystemRoleOptions = rolesJson.map(r => ({ value: r.id, label: r.name }));
export const OrganizationTypes = ["EDUCATIONAL", "PROFESSIONAL", "BUSINESS"] as const;
export type OrganizationType = typeof OrganizationTypes[number];
export const OrganizationTypeOptions = [
    { value: "EDUCATIONAL", label: "Educational" },
    { value: "PROFESSIONAL", label: "Professional" },
    { value: "BUSINESS", label: "Business" },
];
export const OrganizationSchema = z.object({
    type: z.array(z.enum(OrganizationTypes)).optional().describe(JSON.stringify({ type: "select", required: true, label: "Tipo Organizzazione", options: OrganizationTypeOptions, multiple: true })),
    roleId: RoleIdSchema.describe(JSON.stringify({ type: "select", required: true, label: "Ruolo in STANDLO", options: SystemRoleOptions })),
    vatNumber: z.string().optional().describe(JSON.stringify({ type: "vat", required: true, label: "Partita IVA / Codice Fiscale" })),
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
    headquarterId: z.string().optional(),
    placeId: z.string().optional(),
});
export type Organization = z.infer<typeof OrganizationSchema>;
// -- RBAC Policy Matrix per Organization --

export const OrganizationDbSchema = DbSchema.merge(OrganizationSchema);
export type OrganizationDbEntity = z.infer<typeof OrganizationDbSchema>;
