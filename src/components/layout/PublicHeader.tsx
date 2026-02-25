import * as React from "react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/Button"
import { useTranslations } from "next-intl"
import { Logo } from "@/components/ui/Logo"
import { SwitchTheme } from "@/components/ui/SwitchTheme"
import { SwitchLocale } from "@/components/ui/SwitchLocale"

export function PublicHeader() {
    const t = useTranslations("Auth")

    return (
        <header className="layout-header-main">
            <div className="layout-container">
                <div className="layout-header-brand-group">
                    <Link href="/" className="layout-header-brand-link">
                        <Logo size="m" />
                    </Link>
                </div>
                <nav className="layout-nav-links">
                    <Link href="/auth/login" className="layout-header-nav-link">
                        {t("submitButton")}
                    </Link>
                    <Link href="/auth/register">
                        <Button variant="primary">{t("registerAction")}</Button>
                    </Link>
                    <div className="layout-header-public-actions">
                        <SwitchLocale />
                        <SwitchTheme />
                    </div>
                </nav>
            </div>
        </header>
    )
}
