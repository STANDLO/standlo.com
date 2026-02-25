"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, User, sendEmailVerification } from "firebase/auth";
import { auth, appCheck } from "@/core/firebase";
import { getToken } from "firebase/app-check";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CardAuth } from "@/components/ui/CardAuth";

export function FormRegister() {
    const t = useTranslations("Auth");

    const [name, setName] = React.useState("");
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
        const token = await user.getIdToken(true); // Force refresh to get custom claims
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
            // 1. Creiamo l'utente Firebase Auth (Scatena beforeCreate in background, assegnando ruolo 'pending')
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (name) {
                await updateProfile(userCredential.user, { displayName: name });
            }
            await sendEmailVerification(userCredential.user);
            await handleLoginSuccess(userCredential.user);
        } catch (err: unknown) {
            handleError(err);
        }
    };

    const loginWithGoogle = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Stessa cosa: salviamo il ruolo se vuole usare Google (che autogenererà l'email)
            // MA non abbiamo un'email prima del login Google!
            // Per i Provider OAuth, Google SignIn potrebbe usare Google email. Il beforeCreate fallirà a leggerlo se non c'è.
            // Soluzione migliore: i social login defaultano a 'customer' se manca il record in registrationData.
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
            title={t("Register.title")}
            description={t("Register.description")}
            footerText={t("Register.yesAccountText")}
            footerHref="/auth/login"
            footerActionText={t("Register.loginAction")}
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

                <Button type="submit" className="layout-auth-submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : t("Register.submitButton")}
                </Button>

            </form>
        </CardAuth>
    );
}
