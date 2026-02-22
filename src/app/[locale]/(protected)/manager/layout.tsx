import { ReactNode } from "react";
import { LayoutProtected } from "@/components/layout/LayoutProtected";
import { LayoutDashboard, Users, Construction, Wrench, Settings } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function ManagerLayout({ children }: { children: ReactNode }) {
    const t = await getTranslations("components");

    // Mock user for now
    const userName = "Admin Manager";
    const organizationName = "STANDLO Operations"

    const navItems = [
        {
            label: "Dashboard",
            href: "/manager",
            icon: LayoutDashboard,
            matchPattern: "/manager/dashboard"
        },
        {
            label: "Progetti",
            href: "/manager/projects",
            icon: Construction
        },
        {
            label: "Produzione",
            href: "/manager/production",
            icon: Wrench
        },
        {
            label: "Clienti",
            href: "/manager/customers",
            icon: Users
        },
        {
            label: "Impostazioni",
            href: "/manager/settings",
            icon: Settings
        }
    ];

    return (
        <LayoutProtected
            navItems={navItems}
            roleContext={t("roles.manager")}
            userName={userName}
            organizationName={organizationName}
        >
            {children}
        </LayoutProtected>
    );
}
