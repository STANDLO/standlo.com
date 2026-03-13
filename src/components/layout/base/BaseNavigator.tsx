"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X, User, Headset, LogOut } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { SwitchLocale } from "@/components/ui/SwitchLocale";
import { SwitchTheme } from "@/components/ui/SwitchTheme";

export interface NavItem {
    label: string;
    href: string;
    icon?: string;
    matchPattern?: string; // e.g. /customer/projects
}

interface BaseNavigatorProps {
    variant?: 'public' | 'protected';
    navItems?: NavItem[];
    roleContext?: string;
    userName?: string;
    organizationName?: string;
    hasToolsAccess?: boolean;
}

export function BaseNavigator({
    variant = 'public',
    navItems = [],
    roleContext,
    userName,
    organizationName
}: BaseNavigatorProps) {
    const t = useTranslations("components");
    const authT = useTranslations("Auth");
    const locale = useLocale();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Close menu click outside
    const menuRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            const { auth } = await import("@/core/firebase");

            if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken().catch(() => null);
                if (token) {
                    const sessionId = localStorage.getItem("standlo_session");
                    if (sessionId) {
                        const { callGateway } = await import("@/lib/api");
                        await callGateway("orchestrator", {
                            actionId: "auth_event",
                            payload: { type: "logout", sessionId }
                        }).catch(e => console.error("Failed to log auth event (logout):", e));
                    }
                    localStorage.removeItem("standlo_session");
                }
            }

            await auth.signOut();
            await fetch("/api/auth/logout", {
                method: "GET",
            });
            window.location.href = `/${locale}`;
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const IconList = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;

    if (pathname?.includes('/canvas')) return null;

    return (
        <div className="ui-tools-navigator">
            {variant === 'public' ? (
                <>
                    <SwitchLocale />
                    <SwitchTheme />
                    <Link href="/auth/login" className="ui-tools-navigator-link">
                        {authT("submitButton")}
                    </Link>
                    <Link href="/auth/create">
                        <Button variant="green" size="sm">{authT("registerAction")}</Button>
                    </Link>
                </>
            ) : (
                <div className="ui-tools-navigator-menu" ref={menuRef}>
                    <div className="ui-tools-navigator-user-group">
                        <div className="ui-tools-navigator-user-info">
                            <span className="ui-tools-navigator-user-org">{organizationName || t("header.organization_fallback")}</span>
                            <span className="ui-tools-navigator-user-name">{userName || t("header.user_fallback")}</span>
                        </div>
                        <Button
                            variant="light"
                            size="icon"
                            className="ui-tools-navigator-toggle-btn"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>

                    {isMenuOpen && (
                        <div className="ui-tools-navigator-dropdown">
                            <div className="ui-tools-navigator-dropdown-header">
                                <div className="ui-tools-navigator-dropdown-org">{organizationName || t("header.organization_fallback")}</div>
                                <div className="ui-tools-navigator-dropdown-name">{userName || t("header.user_fallback")}</div>
                                <div className="ui-tools-navigator-dropdown-role">
                                    {roleContext}
                                </div>
                            </div>

                            <nav className="ui-tools-navigator-nav">
                                {navItems.map((item, idx) => {
                                    const href = `/${locale}${item.href}`;
                                    const isActive = item.matchPattern
                                        ? pathname.includes(item.matchPattern)
                                        : pathname === href || pathname.startsWith(`${href}/`);

                                    const Icon = item.icon ? IconList[item.icon] : null;

                                    return (
                                        <Link
                                            key={idx}
                                            href={item.href as React.ComponentProps<typeof Link>["href"]}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="ui-tools-navigator-nav-item"
                                            data-active={isActive}
                                        >
                                            {Icon && <Icon className="h-4 w-4" />}
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="ui-tools-navigator-actions">
                                <div className="ui-tools-navigator-action-slot">
                                    <SwitchLocale />
                                </div>
                                <div className="ui-tools-navigator-action-slot">
                                    <SwitchTheme />
                                </div>
                                <div className="ui-tools-navigator-action-slot">
                                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="ui-canvas-tools-btn h-10 w-10 px-0 shrink-0">
                                        <User className="h-5 w-5" />
                                    </Link>
                                </div>
                                <div className="ui-tools-navigator-action-slot">
                                    <Link href="/partner/support" onClick={() => setIsMenuOpen(false)} className="ui-canvas-tools-btn h-10 w-10 px-0 shrink-0">
                                        <Headset className="h-5 w-5" />
                                    </Link>
                                </div>
                            </div>

                            <div className="ui-tools-navigator-logout-wrapper">
                                <button
                                    type="button"
                                    className="ui-tools-navigator-logout-btn"
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        handleLogout();
                                    }}
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    {t("auth.logout")}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
