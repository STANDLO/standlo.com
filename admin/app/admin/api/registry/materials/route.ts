import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { MaterialCreateSchema, MaterialUpdateSchema } from "../../../../../../functions/src/schemas/material";

// Resolve path pointing back to the main app repository
const REGISTRY_PATH = path.resolve(process.cwd(), "..", "src", "core", "constants", "design_materials.json");

export const dynamic = "force-dynamic";

export async function GET() {
    console.log("Forcing Turbopack cache bust - materials");
    try {
        const fileData = await fs.readFile(REGISTRY_PATH, "utf-8");
        const data = JSON.parse(fileData);
        // Format mapping like list response expects { data: [...] }
        return NextResponse.json({ data });
    } catch {
        // If file doesn't exist or is empty, return empty list
        return NextResponse.json({ data: [] });
    }
}

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        let existing: Record<string, unknown>[] = [];
        try {
            const fileData = await fs.readFile(REGISTRY_PATH, "utf-8");
            existing = JSON.parse(fileData);
        } catch {
            // Ignored, file will be created
        }

        const idx = existing.findIndex((e: Record<string, unknown>) => e.id === payload.id);
        const isUpdate = idx >= 0;

        let targetData = isUpdate ? { ...existing[idx], ...payload } : payload;

        // Use exact Zod schema for safety
        if (isUpdate) {
            const parsed = MaterialUpdateSchema.safeParse(targetData);
            if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues));
            targetData = { ...targetData, ...parsed.data, updatedAt: new Date().toISOString() };
            existing[idx] = targetData;
        } else {
            const parsed = MaterialCreateSchema.safeParse(targetData);
            if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues));
            targetData = {
                ...parsed.data,
                id: targetData.id || crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            existing.push(targetData);
        }

        await fs.writeFile(REGISTRY_PATH, JSON.stringify(existing, null, 4));
        return NextResponse.json({ success: true, data: targetData });
    } catch (error: unknown) {
        return NextResponse.json({ error: { message: error instanceof Error ? error.message : "Unknown error" } }, { status: 400 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) throw new Error("Missing Document ID");

        const fileData = await fs.readFile(REGISTRY_PATH, "utf-8");
        let existing = JSON.parse(fileData);
        existing = existing.filter((e: Record<string, unknown>) => e.id !== id);

        await fs.writeFile(REGISTRY_PATH, JSON.stringify(existing, null, 4));
        return NextResponse.json({ success: true, id });
    } catch (error: unknown) {
        return NextResponse.json({ error: { message: error instanceof Error ? error.message : "Unknown error" } }, { status: 400 });
    }
}
