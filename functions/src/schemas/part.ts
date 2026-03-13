import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";
export const PART_CATEGORIES_BY_SECTOR: Record<string, Record<string, string>> = {
    exhibition: {
        wood_panel: "Wood Panel",
        furniture: "Furniture",
        display: "Display",
        structure: "Structure",
        graphic: "Graphic",
        lighting: "Lighting",
        rigging: "Rigging",
        decor: "Decor",
        other: "Other"
    },
    construction: {
        wood_panel: "Wood Panel",
        metal_structure: "Metal Structure",
        floor_panel: "Floor Panel",
        glass: "Glass",
        fasteners: "Fasteners",
        paint: "Paint",
        other: "Other"
    },
    audio_video: {
        screen: "Screen",
        audio_setup: "Audio Setup",
        cables: "Cables",
        camera: "Camera",
        other: "Other"
    },
    electrical: {
        lighting: "Lighting",
        cables: "Cables",
        switch: "Switch",
        socket: "Socket",
        other: "Other"
    }
};
export const PartSchema = BaseSchema.extend({
    name: z.string(),
    description: z.string().optional(),
    sector: z.string(), // e.g. construction, exhibition
    category: z.string(), // e.g. Wood Panel, Fasteners, Cables
    isRentable: z.boolean().default(true),
    isSellable: z.boolean().default(true),
    isConsumable: z.boolean().default(false), // Consumables vs Assets
    baseUnit: z.string().default('pcs'), // 'pcs', 'sqm', 'lm'
    // Spatial properties for handling instances
    position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
    // Financial properties
    cost: z.number().optional().describe("Internal standard cost"),
    price: z.number().optional().describe("External standard price"),
    meshId: z.string().optional().describe("ID della Mesh di base da cui ereditare la geometria e il materiale nativo"),
    defaultTextureId: z.string().optional().describe("ID della texture variante di default (es. Moquette Rossa)"),
    gltfUrl: z.string().optional().describe("URL to the Draco-compressed .glb file stored in Firebase Storage"),
    useCases: z.array(z.object({
        canvasType: z.string(),
        canvasLayer: z.string()
    })).default([]),
    sockets: z.array(z.object({
        id: z.string(),
        type: z.enum(['male', 'female', 'neutral']),
        position: z.tuple([z.number(), z.number(), z.number()]).describe("[x, y, z] coordinates relative to part center"),
        rotation: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional().describe("Quaternion [x, y, z, w] for socket orientation")
    })).default([]),
});
export type Part = z.infer<typeof PartSchema>;
// --- SUBCOLLECTION SCHEMAS ---
export const PartProcessNodeSchema = z.object({
    id: z.string().uuid(),
    processId: z.string(),
    quantity: z.number()
});
export type PartProcessNode = z.infer<typeof PartProcessNodeSchema>;
export const PartToolNodeSchema = z.object({
    id: z.string().uuid(),
    toolId: z.string(),
    quantity: z.number()
});
export type PartToolNode = z.infer<typeof PartToolNodeSchema>;
export const PartCreateSchema = createCreationSchema(PartSchema);
export const PartUpdateSchema = createUpdateSchema(PartSchema);
export const PartSearchSchema = PaginationQuerySchema.extend({
    name: z.string().optional(),
    sector: z.string().optional(),
    category: z.string().optional(),
});
export const PartPolicyMatrix: Record<RoleId, EntityPolicy> = {
    guest: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: { id: { read: true, write: false }, orgId: { read: true, write: false }, name: { read: true, write: false }, code: { read: true, write: false }, ownId: { read: true, write: false }, active: { read: true, write: false }, version: { read: true, write: false }, users: { read: true, write: false }, updates: { read: true, write: false }, meta: { read: true, write: false }, createdAt: { read: true, write: false }, createdBy: { read: true, write: false }, updatedAt: { read: true, write: false }, updatedBy: { read: true, write: false }, deletedAt: { read: true, write: false }, deletedBy: { read: true, write: false }, isArchived: { read: true, write: false }, endLifeTime: { read: true, write: false }, description: { read: true, write: false }, sector: { read: true, write: false }, category: { read: true, write: false }, isRentable: { read: true, write: false }, isSellable: { read: true, write: false }, isConsumable: { read: true, write: false }, baseUnit: { read: true, write: false }, position: { read: true, write: false }, rotation: { read: true, write: false }, cost: { read: true, write: false }, price: { read: true, write: false }, meshId: { read: true, write: false }, gltfUrl: { read: true, write: false }, useCases: { read: true, write: false }, sockets: { read: true, write: false } } },
    pending: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    customer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    provider: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    engineer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
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
    other: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    dryliner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_manager: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: { id: { read: true, write: true }, orgId: { read: true, write: true }, name: { read: true, write: true }, code: { read: true, write: true }, ownId: { read: true, write: true }, active: { read: true, write: true }, version: { read: true, write: true }, users: { read: true, write: true }, updates: { read: true, write: true }, meta: { read: true, write: true }, createdAt: { read: true, write: true }, createdBy: { read: true, write: true }, updatedAt: { read: true, write: true }, updatedBy: { read: true, write: true }, deletedAt: { read: true, write: true }, deletedBy: { read: true, write: true }, isArchived: { read: true, write: true }, endLifeTime: { read: true, write: true }, description: { read: true, write: true }, sector: { read: true, write: true }, category: { read: true, write: true }, isRentable: { read: true, write: true }, isSellable: { read: true, write: true }, isConsumable: { read: true, write: true }, baseUnit: { read: true, write: true }, position: { read: true, write: true }, rotation: { read: true, write: true }, cost: { read: true, write: true }, price: { read: true, write: true }, meshId: { read: true, write: true }, gltfUrl: { read: true, write: true }, useCases: { read: true, write: true }, sockets: { read: true, write: true } } },
    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_designer: { canCreate: true, canRead: true, canUpdate: true, canDelete: true, fieldPermissions: { id: { read: true, write: true }, orgId: { read: true, write: true }, name: { read: true, write: true }, code: { read: true, write: true }, ownId: { read: true, write: true }, active: { read: true, write: true }, version: { read: true, write: true }, users: { read: true, write: true }, updates: { read: true, write: true }, meta: { read: true, write: true }, createdAt: { read: true, write: true }, createdBy: { read: true, write: true }, updatedAt: { read: true, write: true }, updatedBy: { read: true, write: true }, deletedAt: { read: true, write: true }, deletedBy: { read: true, write: true }, isArchived: { read: true, write: true }, endLifeTime: { read: true, write: true }, description: { read: true, write: true }, sector: { read: true, write: true }, category: { read: true, write: true }, isRentable: { read: true, write: true }, isSellable: { read: true, write: true }, isConsumable: { read: true, write: true }, baseUnit: { read: true, write: true }, position: { read: true, write: true }, rotation: { read: true, write: true }, cost: { read: true, write: true }, price: { read: true, write: true }, meshId: { read: true, write: true }, gltfUrl: { read: true, write: true }, useCases: { read: true, write: true }, sockets: { read: true, write: true } } }
};
