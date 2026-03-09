"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    Database,
    Table,
    ShieldAlert,
    Users,
    Key,
    Compass,
    Globe,
    Box,
    Activity,
    ChevronDown,
    ChevronRight,
    Zap
} from "lucide-react";
import clsx from "clsx";

export function Sidebar() {
    const pathname = usePathname();
    const [env, setEnv] = useState<"production" | "emulator">("production");

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (document.cookie.includes("firebase_env=emulator")) {
                setEnv("emulator");
            } else {
                setEnv("production");
            }
        }, 0);
        return () => clearTimeout(timeoutId);
    }, []);

    const handleEnvChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newEnv = e.target.value as "production" | "emulator";
        document.cookie = `firebase_env=${newEnv}; path=/; max-age=31536000`; // 1 year expiry
        setEnv(newEnv);
        window.location.reload();
    };

    const navGroups = [
        {
            title: "Pipelines & AI",
            links: [
                { href: "/pipelines", label: "Pipelines Flow", icon: Activity },
                { href: "/pipelines/run", label: "Pipeline Runner", icon: Zap },
                { href: "/ai-skills", label: "AI Skills Manager", icon: Box },
            ]
        },
        {
            title: "PDM",
            links: [
                { href: "/pdm/materials", label: "Materials", icon: Box },
                { href: "/pdm/textures", label: "Textures", icon: Box },
                { href: "/pdm/meshes", label: "Meshes", icon: Box },
                { href: "/pdm/parts", label: "Parts", icon: Box },
                { href: "/pdm/assemblies", label: "Assemblies", icon: Box },
                { href: "/pdm/bundles", label: "Bundles", icon: Box },
                { href: "/pdm/stands", label: "Stands", icon: Box },
            ]
        },
        {
            title: "MRP",
            links: [
                { href: "/mrp/warehouses", label: "Warehouses", icon: Box },
                { href: "/mrp/shelves", label: "Shelves", icon: Box },
                { href: "/mrp/workcenters", label: "Workcenters", icon: Box },
                { href: "/mrp/processes", label: "Processes", icon: Box },
                { href: "/mrp/tools", label: "Tools", icon: Box },
            ]
        },
        {
            title: "Core Services",
            links: [
                { href: "/database", label: "Database Sync", icon: Database },
                { href: "/users", label: "Users & Activation", icon: Users },
                { href: "/alerts", label: "Security Alerts", icon: ShieldAlert },
            ]
        },
        {
            title: "Modellers",
            links: [
                { href: "/", label: "Schemas", icon: Database },
                { href: "/roles", label: "Roles", icon: Key },
                { href: "/navigation", label: "Navigation", icon: Compass },
                { href: "/i18n", label: "Translations", icon: Globe },
            ]
        },
        {
            title: "Debug",
            links: [
                { href: "/crud", label: "Universal CRUD", icon: Table },
                { href: "/simulator", label: "Role Simulator", icon: Key },
                { href: "/pdm/viewer", label: "3D Canvas", icon: Box },
            ]
        }
    ];

    const [openSections, setOpenSections] = useState<Record<string, boolean>>(
        navGroups.reduce((acc, curr) => ({ ...acc, [curr.title]: true }), {})
    );

    const toggleSection = (title: string) => {
        setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
    };

    return (
        <aside className="w-64 bg-[#f7f9fc] dark:bg-[#0e0e11] border-r border-[#e3e8ee] dark:border-zinc-800 flex flex-col hidden md:flex shrink-0">
            <div className="p-4 flex flex-col gap-3 shrink-0 border-b border-[#e3e8ee] dark:border-zinc-800">
                <div className="flex items-center justify-between h-8">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-[#635BFF] flex items-center justify-center">
                            <span className="text-white font-bold text-xs">S</span>
                        </div>
                        <span className="font-semibold text-sm text-[#1a1f36] dark:text-zinc-100">Standlo Studio</span>
                    </div>
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                        GOD
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-[#8792a2] dark:text-zinc-500 uppercase tracking-widest w-12">ENV</label>
                    <select
                        value={env}
                        onChange={handleEnvChange}
                        className="flex-1 bg-white dark:bg-zinc-900 border border-[#e3e8ee] dark:border-zinc-700 rounded text-xs px-2 py-1 text-[#1a1f36] dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[#635BFF]"
                    >
                        <option value="production">Production</option>
                        <option value="emulator">Local Emulator</option>
                    </select>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-2">
                {navGroups.map((group, idx) => {
                    const isOpen = openSections[group.title];
                    return (
                        <div key={idx} className="space-y-1">
                            <button
                                onClick={() => toggleSection(group.title)}
                                className="w-full flex items-center justify-between px-3 py-1 mb-1 text-[11px] font-semibold text-[#8792a2] dark:text-zinc-500 hover:text-[#1a1f36] dark:hover:text-zinc-300 uppercase tracking-widest transition-colors"
                            >
                                <span>{group.title}</span>
                                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>

                            {isOpen && (
                                <div className="space-y-0.5">
                                    {group.links.map((link) => {
                                        const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                                        const Icon = link.icon;
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                className={clsx(
                                                    "flex items-center gap-2.5 px-3 py-1 rounded-md text-xs font-medium transition-colors",
                                                    isActive
                                                        ? "bg-white dark:bg-zinc-900 text-[#0a2540] dark:text-zinc-50 shadow-sm border border-[#e3e8ee] dark:border-zinc-800"
                                                        : "text-[#425466] dark:text-zinc-400 hover:text-[#0a2540] dark:hover:text-zinc-200 hover:bg-[#e3e8ee]/50 dark:hover:bg-zinc-800/50 border border-transparent"
                                                )}
                                            >
                                                <Icon className={clsx("w-3.5 h-3.5", isActive ? "text-[#635BFF]" : "text-[#8792a2] dark:text-zinc-500")} />
                                                {link.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-[#e3e8ee] dark:border-zinc-800 text-xs text-[#8792a2] dark:text-zinc-500 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                System Active
            </div>
        </aside>
    );
}
