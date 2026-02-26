import { ReactNode } from "react";
import { LayoutProtected } from "@/components/layout/LayoutProtected";
import { getTranslations } from "next-intl/server";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/core/auth-edge";
import { redirect } from "next/navigation";
import type { RoleId } from "../../../../functions/src/schemas/auth";

export default async function ProtectedRootLayout({ children, params }: { children: ReactNode, params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations("components");

    // Fetch Auth Tokens
    const cookieStore = await cookies();
    const tokens = await getTokens(cookieStore, authConfig);

    // Auth Guard
    if (!tokens) {
        redirect(`/${locale}/auth/login`);
    }

    const claims = (tokens.decodedToken || {}) as Record<string, unknown>;
    const role = (claims.role as string) || "pending";
    const userName = (claims.name as string) || (claims.email as string) || "Utente Standlo";
    const organizationName = (claims.orgName as string) || "Ospite";

    // Dynamic Navigation based on Role fetched from WebInterface Backend
    let rawNavigation: Array<{ labelKey: string, path: string, icon?: string, matchPattern?: string }> = [];
    let roleContextLabel = "Ospite";

    if (role === "pending") {
        roleContextLabel = "In attesa";
    } else {
        // In SSR environments where AppCheck is enforced on Cloud Functions, HTTP calls will fail.
        // Instead of fetching the WebInterface gateway, we import the PolicyEngine directly.
        try {
            const { generateNavigationManifest } = await import("../../../../functions/src/rbac/policyEngine");
            rawNavigation = generateNavigationManifest(role as RoleId);
        } catch (err) {
            console.error("[SSR] Failed to generate navigation context from internal Policy Engine:", err);
            rawNavigation = [];
        }

        roleContextLabel = t(`roles.${role}`);
    }

    // Map Backend SDUI Navigation payload to Frontend NavItems, applying Translations
    const navItems: React.ComponentProps<typeof LayoutProtected>['navItems'] = rawNavigation.map(item => ({
        label: t(item.labelKey) || item.labelKey, // Translate or fallback
        href: item.path,
        icon: item.icon as string,
        matchPattern: item.matchPattern
    }));

    return (
        <LayoutProtected
            navItems={navItems}
            roleContext={roleContextLabel}
            userName={userName}
            organizationName={organizationName}
        >
            {children}
        </LayoutProtected>
    );
}
