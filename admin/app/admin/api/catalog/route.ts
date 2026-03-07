import { NextResponse } from "next/server";

export async function GET() {
    try {
        // MOCK: Replace with actual Firebase Admin `db.collection('parts')` etc.
        const catalogItems = [
            {
                id: "part_001",
                type: "parts",
                name: { it: "Pannello Tamburato 100x300", en: "Honeycomb Panel 100x300" },
                fusionId: "urn:adsk.objects:os.object:standlo_catalog/part_001.f3d",
                fusionVersion: 2,
                status: "linked"
            },
            {
                id: "part_002",
                type: "parts",
                name: { it: "Faretto LED 50W", en: "LED Spotlight 50W" },
                fusionId: null,
                fusionVersion: null,
                status: "unlinked"
            },
            {
                id: "assembly_001",
                type: "assemblies",
                name: { it: "Parete Attrezzata H300", en: "Equipped Wall H300" },
                fusionId: null,
                fusionVersion: null,
                status: "unlinked"
            }
        ];

        return NextResponse.json({ success: true, items: catalogItems });
    } catch (e: unknown) {
        return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
    }
}
