import { ReactNode } from "react";
import { LayoutProtected } from "@/components/layout/LayoutProtected";
import { getTranslations } from "next-intl/server";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/core/auth-edge";
import { redirect } from "next/navigation";

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
    const orgId = (claims.organizationId as string) || "default-org";

    // Dynamic Navigation based on Role fetched from WebInterface Backend
    let rawNavigation: Array<{ labelKey: string, path: string, icon?: string, matchPattern?: string }> = [];
    let roleContextLabel = "Ospite";

    if (role === "pending") {
        roleContextLabel = "In attesa";
    } else {
        // Construct the Firebase v2 onCall Function URL
        // Construct the Firebase v2 onCall Function URL
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "standlo";
        const region = "europe-west4";
        const functionName = "webInterface";

        const baseUrl = `https://${region}-${projectId}.cloudfunctions.net/${functionName}`;

        try {
            // Fetch WebInterface Manifest using App Router Cache integration
            const res = await fetch(baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tokens.token}`
                },
                body: JSON.stringify({
                    data: { // Data wrapper is required for onCall specific endpoints
                        roleId: role,
                        orgId: orgId,
                        correlationId: `ssr-nav-${Date.now()}`
                    }
                }),
                // Cache for 1 hour, or tag-based revalidation
                next: { revalidate: 3600, tags: ['webinterface-manifest'] }
            });

            if (res.ok) {
                const json = await res.json();
                rawNavigation = json.result?.manifest?.navigation || [];
            } else {
                console.error("[SSR] Failed to fetch WebInterface:", await res.text());
            }
        } catch (err) {
            console.error("[SSR] Fetch Error to WebInterface:", err);
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
