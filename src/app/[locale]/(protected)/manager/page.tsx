import { getTranslations } from "next-intl/server";

export default async function ManagerDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Dashboard.Manager" });

    return (
        <div className="ui-dashboard-wrapper">
            <div className="ui-dashboard-header">
                <h1 className="ui-dashboard-title">{t("title")}</h1>
                <p className="ui-dashboard-subtitle">
                    {t("subtitle")}
                </p>
            </div>

            <div className="ui-dashboard-grid-4">
                <div className="ui-dashboard-card">
                    <h3 className="ui-dashboard-card-title">{t("card1Title")}</h3>
                    <div className="ui-dashboard-card-value">12</div>
                </div>

                <div className="ui-dashboard-card">
                    <h3 className="ui-dashboard-card-title">{t("card2Title")}</h3>
                    <div className="ui-dashboard-card-value ui-text-destructive">4</div>
                </div>
            </div>
        </div>
    );
}
