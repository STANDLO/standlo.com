import { ReactNode } from "react";
import { LayoutProtected } from "@/components/layout/LayoutProtected";
import { getTranslations } from "next-intl/server";

export default async function DesignerLayout({ children }: { children: ReactNode }) {
    const t = await getTranslations("components");

    const userName = "Mario Designer";
    const organizationName = "Freelance"

    const navItems = [
        {
            label: "Dashboard",
            href: "/designer",
            icon: "LayoutDashboard",
            matchPattern: "/designer/dashboard"
        },
        {
            label: "Design Assegnati",
            href: "/designer/tasks",
            icon: "PenTool"
        },
        {
            label: "Revisioni",
            href: "/designer/reviews",
            icon: "CheckSquare"
        }
    ];

    return (
        <LayoutProtected
            navItems={navItems}
            roleContext={t("roles.designer")}
            userName={userName}
            organizationName={organizationName}
        >
            {children}
        </LayoutProtected>
    );
}
