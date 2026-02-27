"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductPolicyMatrix = exports.ProductSearchSchema = exports.ProductUpdateSchema = exports.ProductCreateSchema = exports.ProductSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
const primitives_1 = require("./primitives");
const PricingTierSchema = zod_1.z.object({
    isActive: zod_1.z.boolean().default(false),
    setupCost: zod_1.z.number().default(0), // Costo fisso iniziale
    tiers: zod_1.z.array(zod_1.z.object({
        upToQuantity: zod_1.z.number().nullable(), // nullable means "and above" for the last tier
        pricePerUnit: zod_1.z.number() // Prezzo unitario per questo scaglione
    })).default([])
});
exports.ProductSchema = base_1.BaseSchema.extend({
    partId: zod_1.z.string(), // Reference to global master Part
    sku: zod_1.z.string().optional(),
    name: primitives_1.LocalizedStringSchema.optional(), // Can override Part name if needed
    description: primitives_1.LocalizedStringSchema.optional(),
    // Pricing configurations (Vendita/Noleggio a scaglioni)
    forRent: PricingTierSchema.optional(),
    forSale: PricingTierSchema.optional(),
    // Chosen specific variant options from the Part's variantsDefinition
    variantOptions: zod_1.z.record(zod_1.z.string(), zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()])).default({}),
    leadTimeDays: zod_1.z.number().default(0), // Preparation time before it's ready
    orphaned: zod_1.z.boolean().default(false) // Data integrity: true if master Part is archived
});
exports.ProductCreateSchema = (0, base_1.createCreationSchema)(exports.ProductSchema);
exports.ProductUpdateSchema = (0, base_1.createUpdateSchema)(exports.ProductSchema);
exports.ProductSearchSchema = base_1.PaginationQuerySchema.extend({
    partId: zod_1.z.string().optional(),
    sku: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
});
exports.ProductPolicyMatrix = {
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
    dryliner: { canCreate: false, canRead: false, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
//# sourceMappingURL=product.js.map