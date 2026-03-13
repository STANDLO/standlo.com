import { NextResponse } from "next/server";
import canvasMaterialsFallback from "@/core/constants/design_materials.json";
import canvasTexturesFallback from "@/core/constants/design_textures.json";
import packageJson from "../../../../../package.json";

export async function GET() {
    try {
        return NextResponse.json({
            status: "success",
            version: packageJson.version,
            dictionaries: {
                materials: canvasMaterialsFallback,
                textures: canvasTexturesFallback
            }
        });
    } catch (error) {
        console.error("Dictionary API Error", error);
        return NextResponse.json({ status: "error", error: "Internal Server Error" }, { status: 500 });
    }
}
