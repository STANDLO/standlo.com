import { getTranslations } from "next-intl/server";
import { OnboardingForm } from "@/components/auth/OnboardingForm";

interface OnboardingPageProps {
    params: Promise<{ locale: string }>;
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
    const { locale } = await params;
    const t = await getTranslations("Auth.Onboarding");

    return (
        <div className="layout-onboarding-page">
            <div className="layout-onboarding-card">

                <div className="text-center">
                    <h2 className="layout-onboarding-title">
                        {t("title", { fallback: "Completa il tuo Profilo B2B" })}
                    </h2>
                    <p className="layout-onboarding-subtitle">
                        {t("subtitle", { fallback: "Per continuare ad utilizzare Standlo, abbiamo bisogno di alcune informazioni obbligatorie per la fatturazione." })}
                    </p>
                </div>

                <div className="mt-8">
                    <OnboardingForm locale={locale} />
                </div>

                <div className="layout-onboarding-footer">
                    <p>&copy; {new Date().getFullYear()} Standlo. Tutti i diritti riservati.</p>
                </div>
            </div>
        </div>
    );
}
