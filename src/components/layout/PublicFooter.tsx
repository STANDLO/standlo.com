import * as React from "react"
import { useTranslations } from "next-intl"

export function PublicFooter() {
    const t = useTranslations("components")

    return (
        <footer className="layout-footer-main">
            <div className="layout-footer-container">
                <p className="layout-footer-text">
                    {t("footer.copyright", { year: new Date().getFullYear() })}
                </p>
                <div className="layout-footer-links">
                    <a href="#" className="layout-footer-link">{t("footer.terms")}</a>
                    <a href="#" className="layout-footer-link">{t("footer.privacy")}</a>
                </div>
            </div>
        </footer>
    )
}

