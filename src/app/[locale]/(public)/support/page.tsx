import { getTranslations } from "next-intl/server";

export default async function SupportPage() {
    const t = await getTranslations("components.footer");
    return (
        <div className="flex min-h-screen items-center justify-center p-8">
            <h1 className="text-2xl font-bold">{t('support')}</h1>
        </div>
    );
}
