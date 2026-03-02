import { NextRequest, NextResponse } from "next/server";
import { generateManifestForEntity, generateNavigationManifest } from "../../../../../functions/src/rbac/policyEngine";
import { OrganizationSchema } from "../../../../../functions/src/schemas/organization";
import { RoleId } from "../../../../../functions/src/schemas/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const entity = searchParams.get("entity");
        const role = (searchParams.get("role") || "pending") as RoleId;

        // Ensure we handle only the 'organization' entity initially (or others if specified later)
        // Since onboarding currently only needs organization fields from webInterface.
        if (entity !== "organization") {
            return NextResponse.json(
                { status: "error", message: `Unsupported entity: ${entity}` },
                { status: 400 }
            );
        }

        const organizationManifest = generateManifestForEntity(
            "organization",
            role,
            OrganizationSchema as z.ZodObject<z.ZodRawShape>
        );

        const navigationManifest = generateNavigationManifest(role);

        return NextResponse.json({
            status: "success",
            manifest: {
                organization: organizationManifest,
                navigation: navigationManifest,
            },
        });
    } catch (error: unknown) {
        console.error("[API][schemas/manifest] Error generating manifest:", error);
        return NextResponse.json(
            { status: "error", message: "Failed to generate manifest" },
            { status: 500 }
        );
    }
}
