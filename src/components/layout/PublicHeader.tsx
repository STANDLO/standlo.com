import * as React from "react"
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/Button"
import { useTranslations } from "next-intl"

export function PublicHeader() {
    const t = useTranslations("Auth.Login")

    return (
        <header className="layout-header-main">
            <div className="layout-container">
                <div className="flex items-center gap-2">
                    <Link href="/" className="font-bold text-xl text-primary tracking-tight">
                        STANDLO
                    </Link>
                </div>
                <nav className="layout-nav-links">
                    <Link href="/auth/login" className="transition-colors hover:text-primary">
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
