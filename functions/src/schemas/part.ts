import { z } from "zod";
import { BaseSchema, createCreationSchema, createUpdateSchema, PaginationQuerySchema } from "./base";
import { RoleId } from "./auth";
import { EntityPolicy } from "../rbac/core";
import { LocalizedStringSchema } from "./primitives";
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
    description: LocalizedStringSchema.optional(),
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
    gltfUrl: z.string().optional().describe("URL to the Draco-compressed .glb file stored in Firebase Storage"),
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
    standlo_manager: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_architect: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_engeneer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} },
    standlo_designer: { canCreate: false, canRead: true, canUpdate: false, canDelete: false, fieldPermissions: {} }
};
