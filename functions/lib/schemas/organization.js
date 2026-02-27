"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationPolicyMatrix = exports.OrganizationSearchSchema = exports.OrganizationUpdateSchema = exports.OrganizationCreateSchema = exports.OrganizationSchema = void 0;
const zod_1 = require("zod");
const base_1 = require("./base");
const auth_1 = require("./auth");
const primitives_1 = require("./primitives");
exports.OrganizationSchema = base_1.BaseSchema.extend({
    roleId: auth_1.RoleIdSchema.describe(JSON.stringify({ type: "select", required: true, label: "Ruolo in STANDLO", options: primitives_1.SystemRoleOptions })),
    vatNumber: zod_1.z.string().optional().describe(JSON.stringify({ type: "vat", required: true, label: "Partita IVA / Codice Fiscale" })),
    pec: zod_1.z.string().email("PEC non valida.").optional(),
    sdiCode: zod_1.z.string().length(7, "Il Codice SDI deve essere di 7 caratteri.").optional(),
    place: zod_1.z.object({
        fullAddress: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        city: zod_1.z.string().optional(),
        province: zod_1.z.string().optional(),
        zipCode: zod_1.z.string().optional(),
        country: zod_1.z.string().optional(),
        googlePlaceId: zod_1.z.string().optional(),
        coordinates: zod_1.z.object({ lat: zod_1.z.number(), lng: zod_1.z.number() }).optional(),
    }).optional().describe(JSON.stringify({ type: "place", required: true, label: "Sede Operativa" })),
    phone: zod_1.z.string().optional(),
    email: zod_1.z.string().email("Formato email non valido.").optional(),
    website: zod_1.z.string().url("URL sito web non valido.").optional(),
    logoUrl: zod_1.z.string().optional().describe(JSON.stringify({ type: "gallery", label: "Logo Aziendale" })),
    logoUrls: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.OrganizationCreateSchema = (0, base_1.createCreationSchema)(exports.OrganizationSchema);
exports.OrganizationUpdateSchema = (0, base_1.createUpdateSchema)(exports.OrganizationSchema);
exports.OrganizationSearchSchema = base_1.PaginationQuerySchema.extend({
    name: zod_1.z.string().optional(),
    roleId: zod_1.z.string().optional(),
    vatNumber: zod_1.z.string().optional(),
});
// -- RBAC Policy Matrix per Organization --
exports.OrganizationPolicyMatrix = {
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
            pec: { read: false, write: false }, // Masked for designers
            sdiCode: { read: false, write: false }, // Masked for designers
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
    dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
//# sourceMappingURL=organization.js.map