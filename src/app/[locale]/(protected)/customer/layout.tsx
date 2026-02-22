import { ReactNode } from "react";
import { LayoutProtected } from "@/components/layout/LayoutProtected";
import { LayoutDashboard, FileText, Settings, UserPlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function CustomerLayout({ children }: { children: ReactNode }) {
    const t = await getTranslations("components");

    // In futuro prenderemo questi dati dal token validato dal proxy/middleware
    // passati tramite headers o server actions. Per ora mock.
    const userName = "Cliente Standlo";
    const organizationName = "Mario Rossi S.p.a."

    const navItems = [
        {
            label: "Dashboard",
            href: "/customer",
            icon: LayoutDashboard,
            matchPattern: "/customer/dashboard"
        },
        {
            label: "I Miei Ordini",
            href: "/customer/orders",
            icon: FileText
        },
        {
            label: "Team",
            href: "/customer/team",
            icon: UserPlus
        },
        {
            label: "Impostazioni",
            href: "/customer/settings",
            icon: Settings
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
