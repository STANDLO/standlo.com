"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface NavItem {
    label: string;
    href: string;
    icon?: LucideIcon;
    matchPattern?: string; // e.g. /customer/projects
}

interface SidebarProps {
    items: NavItem[];
    roleContext: string; // e.g. 'customer', 'manager'
    isOpen?: boolean;
    onClose?: () => void;
}

export function Sidebar({ items, roleContext, isOpen = true, onClose }: SidebarProps) {
    const pathname = usePathname();
    const locale = useLocale();

    return (
        <aside className={cn(
            "layout-sidebar",
            isOpen ? "translate-x-0" : "-translate-x-full"
        )}>
            <div className="layout-sidebar-mobile-header">
                <span className="layout-sidebar-brand">
                    STANDLO<span className="text-secondary">.</span>
                </span>
            </div>

            <div className="layout-sidebar-nav-area">
                <nav className="layout-sidebar-nav">
                    <div className="layout-sidebar-category">
                        Moduli {roleContext}
                    </div>
                    {items.map((item, index) => {
                        const href = `/${locale}${item.href}`;
                        const isActive = item.matchPattern
                            ? pathname.includes(item.matchPattern)
                            : pathname === href || pathname.startsWith(`${href}/`);

                        const Icon = item.icon;

                        return (
                            <Link
                                key={index}
                                href={href}
                                onClick={onClose}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                            >
                                {Icon && <Icon className="h-4 w-4" />}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="border-t border-border p-4">
                <div className="text-xs text-center tracking-tight text-muted-foreground">
                    Standlo © {new Date().getFullYear()}
                </div>
            </div>
        </aside>
    );
}
