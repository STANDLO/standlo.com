import { DbSchema } from "./db";
import { z } from "zod";

import { RoleId } from "./auth";
export const PlaceSchema = z.object({
    fullAddress: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    googlePlaceId: z.string().optional(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

export type Place = z.infer<typeof PlaceSchema>;

// Since Place is heavily linked to Organizations, Warehouses, Fairs, etc.,
// the policy matrix allows managers/providers to create Places, and everyone to read them.

export const PlaceDbSchema = DbSchema.merge(PlaceSchema);
export type PlaceDbEntity = z.infer<typeof PlaceDbSchema>;
