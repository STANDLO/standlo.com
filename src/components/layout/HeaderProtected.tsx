"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X, User, Headset, LogOut } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button, buttonVariants } from "../ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SwitchLocale } from "@/components/ui/SwitchLocale";
import { SwitchTheme } from "@/components/ui/SwitchTheme";

export interface NavItem {
    label: string;
    href: string;
    icon?: string;
    matchPattern?: string; // e.g. /customer/projects
}

interface HeaderProtectedProps {
    navItems: NavItem[];
    roleContext: string;
    userName?: string;
    organizationName?: string;
}

export function HeaderProtected({ navItems, roleContext, userName, organizationName }: HeaderProtectedProps) {
    const t = useTranslations("components");
    const locale = useLocale();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Chiude il menu click outside
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
            const { auth, appCheck } = await import("@/core/firebase");

            if (auth.currentUser) {
                const token = await auth.currentUser.getIdToken().catch(() => null);
                if (token) {
                    const headers: Record<string, string> = {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    };

                    if (appCheck) {
                        try {
                            const { getToken } = await import("firebase/app-check");
                            const appCheckTokenResponse = await getToken(appCheck, false);
                            if (appCheckTokenResponse.token) {
                                headers["X-Firebase-AppCheck"] = appCheckTokenResponse.token;
                            }
                        } catch (err) {
                            console.warn("Failed AppCheck token on logout", err);
                        }
                    }

                    const sessionId = localStorage.getItem("standlo_session");
                    if (sessionId) {
                        await fetch("/api/gateway", {
                            method: "POST",
                            headers: headers,
                            body: JSON.stringify({
                                actionId: "auth_event",
                                payload: { type: "logout", sessionId }
                            })
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

    return (
        <header className="layout-header-protected">
            <div className="layout-header-group">
                <div className="layout-header-brand-link">
                    <Logo size="m" />
                </div>
            </div>

            <div className="layout-header-group relative" ref={menuRef}>
                <div className="layout-header-user-info">
                    <span className="layout-header-user-org">{organizationName || t("header.organization_fallback")}</span>
                    <span className="layout-header-user-role">{userName || t("header.user_fallback")}</span>
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    className="layout-header-mobile-toggle"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {isMenuOpen && (
                    <div className="layout-header-dropdown-menu">
                        <div className="layout-header-dropdown-header">
                            <div className="layout-header-dropdown-title">{organizationName || t("header.organization_fallback")}</div>
                            <div className="layout-header-dropdown-subtitle">{userName || t("header.user_fallback")}</div>
                            <div className="layout-header-dropdown-badge">
                                {roleContext}
                            </div>
                        </div>

                        <nav className="layout-header-dropdown-nav">
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
                                        className={cn(
                                            "layout-header-nav-item",
                                            isActive
                                                ? "layout-header-nav-item-active"
                                                : "layout-header-nav-item-inactive"
                                        )}
                                    >
                                        {Icon && <Icon className="h-4 w-4" />}
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="layout-header-actions-grid">
                            <div className="flex items-center justify-center">
                                <SwitchLocale />
                            </div>
                            <div className="flex items-center justify-center">
                                <SwitchTheme />
                            </div>
                            <div className="flex items-center justify-center">
                                <Link href="/profile" onClick={() => setIsMenuOpen(false)} className={cn(buttonVariants({ variant: "outline", size: "icon" }), "layout-header-action-btn")}>
                                    <User className="h-[1.2rem] w-[1.2rem]" />
                                </Link>
                            </div>
                            <div className="flex items-center justify-center">
                                <Link href="/partner/support" onClick={() => setIsMenuOpen(false)} className={cn(buttonVariants({ variant: "outline", size: "icon" }), "layout-header-action-btn")}>
                                    <Headset className="h-[1.2rem] w-[1.2rem]" />
                                </Link>
                            </div>
                        </div>

                        <div className="layout-header-dropdown-footer">
                            <Button
                                variant="outline"
                                className="layout-header-logout-btn"
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    handleLogout();
                                }}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                {t("auth.logout")}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
