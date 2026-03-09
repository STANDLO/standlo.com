"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Menu, X, User, Headset, LogOut } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SwitchLocale } from "@/components/ui/SwitchLocale";
import { SwitchTheme } from "@/components/ui/SwitchTheme";
import { SwitchColor } from "@/components/ui/SwitchColor";

export interface NavItem {
    label: string;
    href: string;
    icon?: string;
    matchPattern?: string; // e.g. /customer/projects
}

interface ToolsNavigatorProps {
    variant?: 'public' | 'protected';
    navItems?: NavItem[];
    roleContext?: string;
    userName?: string;
    organizationName?: string;
}

export function ToolsNavigator({
    variant = 'public',
    navItems = [],
    roleContext,
    userName,
    organizationName
}: ToolsNavigatorProps) {
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
                        await fetch("/api/gateway?target=orchestrator", {
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
        <div className="fixed top-8 right-8 pointer-events-auto flex items-center gap-2 bg-background/50 backdrop-blur-md px-3 py-2 rounded-2xl border border-border shadow-sm">
            {variant === 'public' ? (
                <>
                    <SwitchColor />
                    <SwitchLocale />
                    <SwitchTheme />
                    <Link href="/auth/login" className="ml-2 text-sm font-medium hover:text-primary transition-colors">
                        {authT("submitButton")}
                    </Link>
                    <Link href="/auth/create">
                        <Button variant="primary" size="sm" className="ml-2">{authT("registerAction")}</Button>
                    </Link>
                </>
            ) : (
                <div className="relative" ref={menuRef}>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-semibold text-foreground">{organizationName || t("header.organization_fallback")}</span>
                            <span className="text-xs text-muted-foreground">{userName || t("header.user_fallback")}</span>
                        </div>
                        <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors h-9 w-9"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>

                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-4 w-72 bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col z-50">
                            <div className="p-4 border-b border-border bg-muted/30">
                                <div className="font-semibold text-foreground truncate">{organizationName || t("header.organization_fallback")}</div>
                                <div className="text-sm text-muted-foreground truncate">{userName || t("header.user_fallback")}</div>
                                <div className="inline-block mt-2 px-2 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-md">
                                    {roleContext}
                                </div>
                            </div>

                            <nav className="flex flex-col p-2 gap-1 overflow-y-auto max-h-[40vh]">
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
                                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                                isActive
                                                    ? "bg-primary/10 text-primary"
                                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                            )}
                                        >
                                            {Icon && <Icon className="h-4 w-4" />}
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="p-3 border-t border-border grid grid-cols-4 gap-2">
                                <div className="flex items-center justify-center">
                                    <SwitchLocale />
                                </div>
                                <div className="flex items-center justify-center">
                                    <SwitchTheme />
                                </div>
                                <div className="flex items-center justify-center">
                                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className={cn(buttonVariants({ variant: "outline", size: "icon" }), "rounded-full w-9 h-9 border-border")}>
                                        <User className="h-4 w-4" />
                                    </Link>
                                </div>
                                <div className="flex items-center justify-center">
                                    <Link href="/partner/support" onClick={() => setIsMenuOpen(false)} className={cn(buttonVariants({ variant: "outline", size: "icon" }), "rounded-full w-9 h-9 border-border")}>
                                        <Headset className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>

                            <div className="p-2 border-t border-border bg-muted/10">
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-start w-full px-4 py-2 text-sm font-medium rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
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
