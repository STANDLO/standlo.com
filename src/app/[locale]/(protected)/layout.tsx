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

    // Dynamic Navigation based on Role
    let navItems: React.ComponentProps<typeof LayoutProtected>['navItems'] = [];
    let roleContextLabel = "Ospite";

    if (role === "customer") {
        roleContextLabel = t("roles.customer");
        navItems = [
            { label: "Dashboard", href: `/${locale}/customer`, icon: "LayoutDashboard", matchPattern: `/${locale}/customer/dashboard` },
            { label: "I Miei Ordini", href: `/${locale}/customer/orders`, icon: "FileText" },
            { label: "Team", href: `/${locale}/customer/team`, icon: "UserPlus" },
            { label: "Impostazioni", href: `/${locale}/customer/settings`, icon: "Settings" }
        ];
    } else if (role === "manager") {
        roleContextLabel = t("roles.manager");
        navItems = [
            { label: "Dashboard", href: `/${locale}/manager`, icon: "LayoutDashboard", matchPattern: `/${locale}/manager/dashboard` },
            { label: "Progetti", href: `/${locale}/manager/projects`, icon: "Construction" },
            { label: "Produzione", href: `/${locale}/manager/production`, icon: "Wrench" },
            { label: "Clienti", href: `/${locale}/manager/customers`, icon: "Users" },
            { label: "Impostazioni", href: `/${locale}/manager/settings`, icon: "Settings" }
        ];
    } else if (role === "designer") {
        roleContextLabel = t("roles.designer");
        navItems = [
            { label: "Dashboard", href: `/${locale}/designer`, icon: "LayoutDashboard", matchPattern: `/${locale}/designer/dashboard` },
            { label: "Design Assegnati", href: `/${locale}/designer/tasks`, icon: "PenTool" },
            { label: "Revisioni", href: `/${locale}/designer/reviews`, icon: "CheckSquare" }
        ];
    } else if (role === "pending") {
        roleContextLabel = "In attesa";
        navItems = []; // No navigation during onboarding
    }

    // Dynamic Navigation injection based on internal Organization Role (ADMIN)
    const userType = claims.type as string; // 'ADMIN', 'DESIGNER', etc.
    if (userType === "ADMIN" && role !== "pending") {
        // Group the staff management icon
        navItems.push({
            label: "Staff & Permessi",
            href: `/${locale}/users`,
            icon: "ShieldAlert",
            matchPattern: `/${locale}/users`
        });
    }

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
