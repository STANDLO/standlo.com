"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, GithubAuthProvider, User } from "firebase/auth";
import { auth, appCheck } from "@/core/firebase";
import { getToken } from "firebase/app-check";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Github } from "lucide-react";

export function LoginForm() {
    const t = useTranslations("Auth.Login");

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

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
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Invalid credentials");
            }
            setIsLoading(false);
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
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Login failed");
            }
            setIsLoading(false);
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
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Login failed");
            }
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium leading-none">
                    {t("emailLabel")}
                </label>
                <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium leading-none">
                    {t("passwordLabel")}
                </label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? "..." : t("submitButton")}
            </Button>

            <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                        {t("dividerText")}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={loginWithGoogle}
                    disabled={isLoading}
                >
                    Google
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={loginWithGithub}
                    disabled={isLoading}
                >
                    <Github className="mr-2 h-4 w-4" />
                    GitHub
                </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center mt-4">
                {t("footerNote")}
            </p>
        </form>
    );
}
