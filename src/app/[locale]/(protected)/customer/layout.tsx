import { ReactNode } from "react";
import { LayoutProtected } from "@/components/layout/LayoutProtected";
import { getTranslations } from "next-intl/server";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/core/auth-edge";

export default async function CustomerLayout({ children }: { children: ReactNode }) {
    const t = await getTranslations("components");

    const tokens = await getTokens(await cookies(), authConfig);
    const claims = (tokens?.decodedToken || {}) as Record<string, unknown>;

    console.log("=== CUSTOM CLAIMS (CUSTOMER) ===", JSON.stringify(claims, null, 2));

    const userName = (claims.name as string) || (claims.email as string) || "Cliente Standlo";
    const organizationName = (claims.orgName as string) || "STANDLO";

    const navItems = [
        {
            label: "Dashboard",
            href: "/customer",
            icon: "LayoutDashboard",
            matchPattern: "/customer/dashboard"
        },
        {
            label: "I Miei Ordini",
            href: "/customer/orders",
            icon: "FileText"
        },
        {
            label: "Team",
            href: "/customer/team",
            icon: "UserPlus"
        },
        {
            label: "Impostazioni",
            href: "/customer/settings",
            icon: "Settings"
        }
    ];

    return (
        <LayoutProtected
            navItems={navItems}
            roleContext={t("roles.customer")}
            userName={userName}
            organizationName={organizationName}
        >
            {children}
        </LayoutProtected>
    );
}
