import { getTranslations } from "next-intl/server";

export default async function DesignerDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Dashboard.Designer" });

    return (
        <div className="ui-dashboard-wrapper">
            <div className="ui-dashboard-header">
                <h1 className="ui-dashboard-title ui-text-accent">{t("title")}</h1>
                <p className="ui-dashboard-subtitle">
                    {t("subtitle")}
                </p>
            </div>

            <div className="ui-dashboard-grid-2">
                <div className="ui-dashboard-card ui-dashboard-card-accent">
                    <h3 className="ui-dashboard-card-title">{t("card1Title")}</h3>
                    <div className="ui-dashboard-card-value">3</div>
                </div>
            </div>
        </div>
    );
}
