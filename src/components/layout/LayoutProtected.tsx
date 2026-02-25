"use client";

import * as React from "react";
import { HeaderProtected, NavItem } from "./HeaderProtected";

interface LayoutProtectedProps {
    children: React.ReactNode;
    navItems: NavItem[];
    roleContext: string;
    userName?: string;
    organizationName?: string;
}

export function LayoutProtected({ children, navItems, roleContext, userName, organizationName }: LayoutProtectedProps) {
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
                {/* Main Content Area - Full Width */}
                <main className="layout-content-area">
                    <div className="layout-content-container">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
