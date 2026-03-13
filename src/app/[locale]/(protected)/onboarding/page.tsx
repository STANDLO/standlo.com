import { OrganizationOnboarding } from "@/components/forms/OrganizationOnboarding";

interface OnboardingPageProps {
    params: Promise<{ locale: string }>;
}

export default async function OnboardingPage({ params }: OnboardingPageProps) {
    const { locale } = await params;

    return (
        <div className="layout-main-body flex p-4 w-full min-h-screen">
            <OrganizationOnboarding locale={locale} />
        </div>
    );
}
