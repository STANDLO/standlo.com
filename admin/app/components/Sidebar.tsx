"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Database,
    Table,
    ShieldAlert,
    Users,
    Key,
    Compass,
    Globe,
    Box
} from "lucide-react";
import clsx from "clsx";

export function Sidebar() {
    const pathname = usePathname();

    const navGroups = [
        {
            title: "Core Services",
            links: [
                { href: "/", label: "Visual IDE & Schemas", icon: Database },
                { href: "/crud", label: "Universal CRUD", icon: Table },
                { href: "/users", label: "Users & Activation", icon: Users },
                { href: "/alerts", label: "Security Alerts", icon: ShieldAlert },
                { href: "/simulator", label: "Role Simulator", icon: Key },
            ]
        },
        {
            title: "Modellers",
            links: [
                { href: "/roles", label: "Designer Ruoli", icon: Key },
                { href: "/navigation", label: "Navigation Modeler", icon: Compass },
                { href: "/i18n", label: "Gestione Traduzioni", icon: Globe },
                { href: "/canvas-manager", label: "Canvas 3D Manager", icon: Box },
            ]
        }
    ];

    return (
        <aside className="w-64 bg-[#f7f9fc] dark:bg-[#0e0e11] border-r border-[#e3e8ee] dark:border-zinc-800 flex flex-col hidden md:flex shrink-0">
            <div className="p-4 flex items-center justify-between h-14 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#635BFF] flex items-center justify-center">
                        <span className="text-white font-bold text-xs">S</span>
                    </div>
                    <span className="font-semibold text-sm text-[#1a1f36] dark:text-zinc-100">Standlo Studio</span>
                </div>
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                    GOD MODE
                </span>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-6">
                {navGroups.map((group, idx) => (
                    <div key={idx} className="space-y-1">
                        <h4 className="px-3 text-[11px] font-semibold text-[#8792a2] dark:text-zinc-500 uppercase tracking-widest mb-2">
                            {group.title}
                        </h4>
                        <div className="space-y-0.5">
                            {group.links.map((link) => {
                                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={clsx(
                                            "flex items-center gap-3 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                                            isActive
                                                ? "bg-white dark:bg-zinc-900 text-[#0a2540] dark:text-zinc-50 shadow-sm border border-[#e3e8ee] dark:border-zinc-800"
                                                : "text-[#425466] dark:text-zinc-400 hover:text-[#0a2540] dark:hover:text-zinc-200 hover:bg-[#e3e8ee]/50 dark:hover:bg-zinc-800/50 border border-transparent"
                                        )}
                                    >
                                        <Icon className={clsx("w-4 h-4", isActive ? "text-[#635BFF]" : "text-[#8792a2] dark:text-zinc-500")} />
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-[#e3e8ee] dark:border-zinc-800 text-xs text-[#8792a2] dark:text-zinc-500 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                System Active
            </div>
        </aside>
    );
}
