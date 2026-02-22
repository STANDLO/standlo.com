import * as React from "react";
import { useTranslations } from "next-intl";
import { LogOut, User, Menu } from "lucide-react";
import { Button } from "../ui/Button";

interface HeaderProtectedProps {
    onMenuClick?: () => void;
    userName?: string;
    organizationName?: string;
}

export function HeaderProtected({ onMenuClick, userName, organizationName }: HeaderProtectedProps) {
    const t = useTranslations("components");

    // Funzione finta per ora. Poi la agganciamo a firebase auth signOut.
    const handleLogout = () => {
        window.location.href = `/api/auth/logout`;
    };

    return (
        <header className="layout-header-protected">
            <div className="layout-header-group">
                <Button variant="outline" size="icon" className="layout-header-mobile-btn" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
                <div className="layout-header-brand">
                    STANDLO<span className="text-secondary">.</span>
                </div>
            </div>

            <div className="layout-header-group">
                <div className="layout-header-user-info">
                    <span className="font-semibold">{organizationName || "Organizzazione"}</span>
                    <span className="layout-header-user-role">{userName || "Utente"}</span>
                </div>

                <Button variant="secondary" size="icon" className="layout-avatar-btn">
                    <User className="h-5 w-5" />
                </Button>

                <Button variant="outline" size="sm" onClick={handleLogout} className="layout-logout-btn">
                    <LogOut className="h-4 w-4 mr-2" />
                    {t("auth.logout")}
                </Button>
            </div>
        </header>
    );
}
