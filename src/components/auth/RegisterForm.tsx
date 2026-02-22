"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth";
import { auth } from "@/core/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function RegisterForm() {
    const t = useTranslations("Auth.Register");

    const [name, setName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleLoginSuccess = async (user: User) => {
        const token = await user.getIdToken(true); // Force refresh to get custom claims
        const res = await fetch("/api/auth/login", {
            headers: {
                Authorization: `Bearer ${token}`
            }
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
            await handleLoginSuccess(userCredential.user);
        } catch (err: unknown) {
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Registration failed");
            }
            setIsLoading(false);
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
            console.error(err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown error occurred");
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
                <label htmlFor="name" className="text-sm font-medium leading-none">
                    {t("nameLabel")}
                </label>
                <Input
                    id="name"
                    type="text"
                    placeholder={t("namePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>

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

            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={loginWithGoogle}
                disabled={isLoading}
            >
                {t("continueGoogle")}
            </Button>
        </form>
    );
}
