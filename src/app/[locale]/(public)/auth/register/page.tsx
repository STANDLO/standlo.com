import { useTranslations } from "next-intl";
import { CardAuth } from "@/components/auth/CardAuth";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
    const t = useTranslations("Auth.Register");

    return (
        <div className="layout-auth-page">
            <CardAuth
                title={t("title")}
                description={t("description")}
                footerText={t("yesAccountText")}
                footerHref="/auth/login"
                footerActionText={t("loginAction")}
            >
                <RegisterForm />
            </CardAuth>
        </div>
    );
}
