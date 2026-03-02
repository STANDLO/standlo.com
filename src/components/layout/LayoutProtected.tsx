"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { HeaderProtected, NavItem } from "./HeaderProtected";

interface LayoutProtectedProps {
    children: React.ReactNode;
    navItems: NavItem[];
    roleContext: string;
    userName?: string;
    organizationName?: string;
}

export function LayoutProtected({ children, navItems, roleContext, userName, organizationName }: LayoutProtectedProps) {
    const pathname = usePathname();
    const isCanvasPage = pathname.includes("/canvas");

    return (
        <div className="layout-protected-root">
            {/* Header Desktop & Mobile with Dropdown Navigation */}
            <HeaderProtected
                navItems={navItems}
                roleContext={roleContext}
                userName={userName}
                organizationName={organizationName}
            />

            <div className="layout-main-wrapper">
                {/* Main Content Area - conditionally Full Width for Canvas */}
                <main className={isCanvasPage ? "layout-content-area-canvas" : "layout-content-area"}>
                    <div className={isCanvasPage ? "layout-content-full" : "layout-content-container"}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
