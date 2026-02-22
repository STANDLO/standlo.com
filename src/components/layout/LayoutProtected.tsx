"use client";

import * as React from "react";
import { Sidebar, NavItem } from "./Sidebar";
import { HeaderProtected } from "./HeaderProtected";
import { cn } from "@/lib/utils";

interface LayoutProtectedProps {
    children: React.ReactNode;
    navItems: NavItem[];
    roleContext: string;
    userName?: string;
    organizationName?: string;
}

export function LayoutProtected({ children, navItems, roleContext, userName, organizationName }: LayoutProtectedProps) {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    // Chiudi la sidebar su mobile quando la finestra viene ridimensionata a blocco md o più
    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setIsSidebarOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="layout-protected-root">
            {/* Header Mobile & Desktop */}
            <HeaderProtected
                onMenuClick={() => setIsSidebarOpen(true)}
                userName={userName}
                organizationName={organizationName}
            />

            <div className="layout-main-wrapper">
                {/* Overlay per mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="layout-mobile-overlay"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-hidden="true"
                    />
                )}

                {/* Sidebar (Desktop fissa, Mobile offcanvas) */}
                <div className={cn(
                    "layout-sidebar-wrapper",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}>
                    <Sidebar
                        items={navItems}
                        roleContext={roleContext}
                        isOpen={true}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                </div>

                {/* Main Content Area */}
                <main className="layout-content-area">
                    <div className="layout-content-container">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
