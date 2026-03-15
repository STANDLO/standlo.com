import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
const PricingTierSchema = z.object({
    isActive: z.boolean().default(false),
    setupCost: z.number().default(0), // Costo fisso iniziale
    tiers: z.array(z.object({
        upToQuantity: z.number().nullable(), // nullable means "and above" for the last tier
        pricePerUnit: z.number() // Prezzo unitario per questo scaglione
    })).default([])
});
export const ProductSchema = z.object({
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
export const ProductDbSchema = DbSchema.merge(ProductSchema);
export type ProductDbEntity = z.infer<typeof ProductDbSchema>;
