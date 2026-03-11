"use client";

import * as React from "react";
import { useTheme } from "@/providers/ThemeProvider";
import { useTranslations } from "next-intl";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, sendEmailVerification } from "firebase/auth";
import { auth } from "@/core/firebase";
import { Link } from "@/i18n/routing";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Card, CardColor, CardDivider } from "@/components/ui/Card";
import { CardAuthSocials } from "@/components/ui/CardAuthSocials";
import { useBrandColor } from "@/hooks/useBrandColor";

export function FormRegister() {
    const t = useTranslations("Auth");
    const { theme: resolvedTheme } = useTheme();
    const btnVariant = resolvedTheme === "dark" ? "dark" : "light";

    const tBrand = useTranslations("Brand");
    const { color } = useBrandColor();
    const activeColor = color === "default" ? "green" : color;

    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [acceptedTerms, setAcceptedTerms] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleError = (err: unknown) => {
        console.error(err);
        if (typeof err === "object" && err !== null && "code" in err) {
            const code = (err as { code: string }).code;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const translated = t(`Errors.${code}` as any);
            setError(translated.includes("Errors.") ? t("Errors.default") : translated);
        } else if (err instanceof Error) {
            setError(err.message);
        } else {
            setError(t("Errors.default"));
        }
        setIsLoading(false);
    };

    const handleLoginSuccessRedirect = async () => {
        await auth.signOut();
        window.location.href = "/auth/login?registered=true";
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Creiamo l'utente Firebase Auth (Scatena beforeCreate in background, assegnando ruolo 'pending')
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (name) {
                await updateProfile(userCredential.user, { displayName: name });
            }
            await sendEmailVerification(userCredential.user);
            await handleLoginSuccessRedirect();
        } catch (err: unknown) {
            handleError(err);
        }
    };

    const loginWithGoogle = async () => {
        if (!acceptedTerms) {
            setError(t("Errors.auth-missing-terms") || "You must accept the Privacy Policy and Terms & Conditions before continuing.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            await handleLoginSuccessRedirect();
        } catch (err: unknown) {
            handleError(err);
        }
    };

    const loginWithGithub = async () => {
        if (!acceptedTerms) {
            setError(t("Errors.auth-missing-terms") || "You must accept the Privacy Policy and Terms & Conditions before continuing.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const provider = new GithubAuthProvider();
            await signInWithPopup(auth, provider);
            await handleLoginSuccessRedirect();
        } catch (err: unknown) {
            handleError(err);
        }
    };

    const footerText = t("Register.yesAccountText");
    const footerHref = "/auth/login";
    const footerActionText = t("Register.loginAction");

    const footer = (
        <>
            <div className="ui-card-auth-note">
                {footerText}{" "}
                <Link href={footerHref} className="ui-card-auth-link">
                    {footerActionText}
                </Link>
            </div>
            <div className="ui-card-auth-copyright">
                {tBrand("copyright", { year: new Date().getFullYear() })}
            </div>
        </>
    );

    return (
        <Card
            color={activeColor as CardColor}
            layout="auto"
            title={t("Register.title")}
            footer={footer}
        >
            <form onSubmit={onSubmit} className="layout-auth-form">
                {error && (
                    <div className="layout-auth-error">
                        <TriangleAlert className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <CardDivider>{t("Register.termsDivider")}</CardDivider>

                <Checkbox
                    id="acceptTerms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    disabled={isLoading}
                    label={
                        t.rich("Register.acceptTerms", {
                            privacyLink: (chunks) => (
                                <Link href="/privacy" className="ui-checkbox-link" target="_blank">
                                    {chunks}
                                </Link>
                            ),
                            termsLink: (chunks) => (
                                <Link href="/terms" className="ui-checkbox-link" target="_blank">
                                    {chunks}
                                </Link>
                            ),
                            br: () => <br />,
                            fallback: "I accept the Privacy Policy and Terms of Service"
                        })
                    }
                />

                <CardAuthSocials
                    onGoogleLogin={loginWithGoogle}
                    onGithubLogin={loginWithGithub}
                    isLoading={isLoading}
                />

                <Input
                    id="name"
                    type="text"
                    label={`${t("Register.nameLabel")} *`}
                    containerClassName="layout-auth-field"
                    placeholder={t("Register.namePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                />

                <Input
                    id="email"
                    type="email"
                    label={`${t("emailLabel")} *`}
                    containerClassName="layout-auth-field"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                />

                <Input
                    id="password"
                    type="password"
                    label={`${t("passwordLabel")} *`}
                    containerClassName="layout-auth-field"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                />

                <CardDivider>{t("Register.registerDivider")}</CardDivider>

                <Button type="submit" variant={btnVariant} className="layout-auth-submit" disabled={isLoading || !acceptedTerms}>
                    {isLoading ? <Loader2 className="animate-spin" /> : t("Register.submitButton")}
                </Button>

            </form>
        </Card>
    );
}
