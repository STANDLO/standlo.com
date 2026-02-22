import { useTranslations } from "next-intl";
import { CardAuth } from "@/components/auth/CardAuth";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
    const t = useTranslations("Auth.Login");

    return (
        <div className="layout-auth-page">
            <CardAuth
                title={t("title")}
                description={t("description")}
                footerText={t("noAccountText")}
                footerHref="/auth/register"
                footerActionText={t("registerAction")}
            >
                <LoginForm />
            </CardAuth>
        </div>
    );
}
