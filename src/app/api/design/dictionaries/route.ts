import { NextResponse } from "next/server";
import packageJson from "../../../../../package.json";
import designMaterialsFallback from "@/core/constants/design_materials.json";
import designTexturesFallback from "@/core/constants/design_textures.json";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const clientVersion = searchParams.get("v");

        // Simple version check (can be expanded to content-hashing later)
        const currentVersion = packageJson.version;
        if (clientVersion === currentVersion) {
            return NextResponse.json({ status: "not_modified", version: currentVersion }, { status: 304 });
        }

        // Fetch dictionaries from static JSON directly (no Firestore lookup needed for now)
        const materials = designMaterialsFallback;
        const textures = designTexturesFallback;

        // In a real optimized scenario we'd use msgpack to compress but JSON is fine for MVP
        return NextResponse.json({
            status: "success",
            version: currentVersion,
            dictionaries: {
                materials,
                textures
            }
        });
    } catch (error) {
        console.error("Dictionary API Error", error);
        return NextResponse.json({ status: "error", error: "Internal Server Error" }, { status: 500 });
    }
}
