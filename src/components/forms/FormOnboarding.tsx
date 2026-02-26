"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { DynamicSDUIForm, SDUIField } from "@/components/forms/DynamicSDUIForm";
import { auth, functions, appCheck } from "@/core/firebase";
import { httpsCallable } from "firebase/functions";
import { signInWithCustomToken } from "firebase/auth";
import { getToken } from "firebase/app-check";
import { CardOnboarding } from "@/components/ui/CardOnboarding";
import { TriangleAlert } from "lucide-react";

export function FormOnboarding({ locale }: { locale: string }) {
    const t = useTranslations("Onboarding");

    const [fields, setFields] = React.useState<SDUIField[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchSchema = async () => {
            try {
                await auth.authStateReady();
                const user = auth.currentUser;
                if (user) {
                    await user.getIdTokenResult(true);
                } else {
                    console.log("=== AUTH READY BUT NO USER FOUND ===");
                }

                const webInterface = httpsCallable(functions, "webInterface");
                // Richiediamo lo schema per le Organizzazioni. Per l'onboarding usiamo ruolo pending 
                // con permessi di compilazione abilitati
                const res = await webInterface({
                    actionId: "getSchema",
                    roleId: "pending"
                });

                const data = res.data as { status: string, manifest?: { organization?: { fields?: SDUIField[] } } };
                if (data.status === "success" && data.manifest?.organization?.fields) {
                    setFields(data.manifest.organization.fields);
                } else {
                    throw new Error("Invalid manifest payload");
                }
            } catch (err: unknown) {
                console.error("Failed to load SDUI manifest:", err);
                setError("Impossibile caricare il modulo di Onboarding.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSchema();
    }, []);

    const onSubmit = async (formData: Record<string, unknown>) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const orchestrator = httpsCallable(functions, "orchestrator");
            const res = await orchestrator({
                actionId: "onboard_organization",
                payload: formData
            });

            const data = res.data as { status: string, message?: string, customToken?: string };

            if (data.status !== "success") {
                throw new Error(data.message || "Failed to complete onboarding");
            }

            // Authentication Synchronization with Custom Token
            if (data.customToken) {
                const userCredential = await signInWithCustomToken(auth, data.customToken);
                const idToken = await userCredential.user.getIdToken(true);

                const headers: Record<string, string> = { Authorization: `Bearer ${idToken}` };
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

                // Update Edge cookies
                await fetch("/api/auth/login", { headers });
            }

            // Redirect on success
            window.location.href = `/${locale}`;

        } catch (err: unknown) {
            console.error("Onboarding submission failed:", err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Onboarding fallito, riprova più tardi.");
            }
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Caricamento modulo sicuro...</div>;
    }

    return (
        <CardOnboarding title={t("title")} subtitle={t("subtitle")}>
            <div className="layout-auth-form-wrapper">
                {error && (
                    <div className="layout-auth-error mb-4">
                        <TriangleAlert className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                <DynamicSDUIForm
                    fields={fields}
                    onSubmit={onSubmit}
                    loading={isSubmitting}
                    submitLabel={t("submitButton")}
                />
            </div>
        </CardOnboarding>
    );
}
