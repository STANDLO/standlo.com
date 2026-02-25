import { FormOnboarding } from "@/components/forms/FormOnboarding";

interface OnboardingPageProps {
    params: Promise<{ locale: string }>;
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
    const { locale } = await params;

    return (
        <div className="layout-onboarding-page">
            <FormOnboarding locale={locale} />
        </div>
    );
}
