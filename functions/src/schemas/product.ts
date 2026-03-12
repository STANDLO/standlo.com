import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";
const PricingTierSchema = z.object({
    isActive: z.boolean().default(false),
    setupCost: z.number().default(0), // Costo fisso iniziale
    tiers: z.array(z.object({
        upToQuantity: z.number().nullable(), // nullable means "and above" for the last tier
        pricePerUnit: z.number() // Prezzo unitario per questo scaglione
    })).default([])
});
export const ProductSchema = BaseSchema.extend({
    partId: z.string(), // Reference to global master Part
    sku: z.string().optional(),
    name: z.string().optional(), // Can override Part name if needed
    description: z.string().optional(),
    // Pricing configurations (Vendita/Noleggio a scaglioni)
    forRent: PricingTierSchema.optional(),
    forSale: PricingTierSchema.optional(),
    // Chosen specific variant options from the Part's variantsDefinition
    variantOptions: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
    leadTimeDays: z.number().default(0), // Preparation time before it's ready
    orphaned: z.boolean().default(false) // Data integrity: true if master Part is archived
});
export type Product = z.infer<typeof ProductSchema>;
export const ProductCreateSchema = createCreationSchema(ProductSchema);
export const ProductUpdateSchema = createUpdateSchema(ProductSchema);
export const ProductSearchSchema = PaginationQuerySchema.extend({
    partId: z.string().optional(),
    sku: z.string().optional(),
    name: z.string().optional(),
});
export const ProductPolicyMatrix: Record<RoleId, EntityPolicy> = {
    guest: {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        fieldPermissions: {}
    },
    pending: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: {} },
    architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    engineer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    electrician: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plumber: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    carpenter: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    cabinetmaker: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    ironworker: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    windowfitter: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    glazier: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    riggers: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standbuilder: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    plasterer: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    painter: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    tiler: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    driver: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    forkliftdriver: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    promoter: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    other: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    dryliner: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
