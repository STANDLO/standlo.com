import * as React from "react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/Button"
import { useTranslations } from "next-intl"
import { Logo } from "@/components/ui/Logo"

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
                </nav>
            </div>
        </header>
    )
}
