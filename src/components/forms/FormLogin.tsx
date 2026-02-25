"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, User } from "firebase/auth";
import { auth, appCheck } from "@/core/firebase";
import { getToken } from "firebase/app-check";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CardAuth } from "@/components/ui/CardAuth";

export function FormLogin() {
    const t = useTranslations("Auth");

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
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

    const handleLoginSuccess = async (user: User) => {
        const token = await user.getIdToken();
        const headers: Record<string, string> = {
            Authorization: `Bearer ${token}`
        };

        if (appCheck) {
            try {
                const appCheckTokenResponse = await getToken(appCheck, false);
                if (appCheckTokenResponse.token) {
                    headers["X-Firebase-AppCheck"] = appCheckTokenResponse.token;
                }
            } catch (err) {
                console.warn("Failed to get AppCheck token:", err);
            }
        }

        const res = await fetch("/api/auth/login", {
            headers
        });

        if (res.ok) {
            // Let the edge proxy redirect the user based on their role
            window.location.href = "/";
        } else {
            setError("Failed to create session. Please try again.");
            setIsLoading(false);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await handleLoginSuccess(userCredential.user);
        } catch (err: unknown) {
            handleError(err);
        }
    };

    const loginWithGoogle = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            await handleLoginSuccess(userCredential.user);
        } catch (err: unknown) {
            handleError(err);
        }
    };

    const loginWithGithub = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const provider = new GithubAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            await handleLoginSuccess(userCredential.user);
        } catch (err: unknown) {
            handleError(err);
        }
    };

    return (
        <CardAuth
            title={t("title")}
            description={t("description")}
            footerText={t("noAccountText")}
            footerHref="/auth/register"
            footerActionText={t("registerAction")}
            onGoogleLogin={loginWithGoogle}
            onGithubLogin={loginWithGithub}
            isLoading={isLoading}
        >
            <form onSubmit={onSubmit} className="layout-auth-form">
                {error && (
                    <div className="layout-auth-error">
                        {error}
                    </div>
                )}

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

                <Button type="submit" className="layout-auth-submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : t("submitButton")}
                </Button>



                <p className="layout-auth-footer-note">
                    {t("footerNote")}
                </p>
            </form>
        </CardAuth>
    );
}
