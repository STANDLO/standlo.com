import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// When running admin dev server, process.cwd() is standlo.com/admin
// We need to surface up to standlo.com then into src
const CONSTANTS_DIR = path.resolve(process.cwd(), "..", "src/core/constants");
const FILE_PATH = path.join(CONSTANTS_DIR, "design_materials.json");

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const fileContent = await fs.readFile(FILE_PATH, "utf-8");
        const data = JSON.parse(fileContent);
        return NextResponse.json({ data });
    } catch (e: unknown) {
        console.error("Error reading materials", e);
        return NextResponse.json({ data: [], error: (e as Error).message, path: FILE_PATH, cwd: process.cwd() });
    }
}

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const fileContent = await fs.readFile(FILE_PATH, "utf-8");
        const data: Record<string, unknown>[] = JSON.parse(fileContent);

        if (payload.id) {
            // Update
            const index = data.findIndex(m => m.id === payload.id);
            if (index >= 0) {
                data[index] = { ...data[index], ...payload };
            } else {
                data.push(payload);
            }
        } else {
            // Create
            payload.id = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            data.push(payload);
        }

        await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 4));
        return NextResponse.json({ success: true, data });
    } catch (e) {
        console.error("Error saving material", e);
        return NextResponse.json({ error: "Failed to save material" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });

        const fileContent = await fs.readFile(FILE_PATH, "utf-8");
        let data: Record<string, unknown>[] = JSON.parse(fileContent);
        
        data = data.filter(m => m.id !== id);

        await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 4));
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Error deleting material", e);
        return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
    }
}
