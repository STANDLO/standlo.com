"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { auth, appCheck } from "@/core/firebase";
import { getToken } from "firebase/app-check";
import { sendEmailVerification } from "firebase/auth";
import { Loader2, TriangleAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardColor } from "@/components/ui/Card";
import { useBrandColor } from "@/hooks/useBrandColor";

export function FormVerifyEmail() {
    const t = useTranslations("Auth");
    const tBrand = useTranslations("Brand");
    const { color } = useBrandColor();
    const activeColor = color === "default" ? "green" : color;

    const [isLoading, setIsLoading] = React.useState(false);
    const [message, setMessage] = React.useState<{ type: 'error' | 'success', text: string } | null>(null);

    const footer = (
        <div className="ui-card-auth-copyright">
            {tBrand("copyright", { year: new Date().getFullYear() })}
        </div>
    );

    const handleCheckStatus = async () => {
        setIsLoading(true);
        setMessage(null);

        try {
            const user = auth.currentUser;
            if (!user) {
                // Se non c'è utente, probabilmente è stato sloggato.
                window.location.href = "/auth/login";
                return;
            }

            // Forza il reload dell'utente per aggiornare l'oggetto currentUser.emailVerified
            await user.reload();

            if (user.emailVerified) {
                // Rinnova i cookie di sessione con i claim aggiornati
                const token = await user.getIdToken(true);
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
                    // Redirect per permettere al middleware di smistarlo in avanti verso onboarding o dashboard
                    window.location.href = "/";
                } else {
                    setMessage({ type: 'error', text: t("VerifyEmail.errorMessage") });
                }
            } else {
                setMessage({ type: 'error', text: t("VerifyEmail.notVerifiedMessage") });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: t("VerifyEmail.errorMessage") });
        }
        setIsLoading(false);
    };

    const handleResend = async () => {
        setIsLoading(true);
        setMessage(null);

        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                setMessage({ type: 'success', text: t("VerifyEmail.emailSentMessage") });
            } else {
                window.location.href = "/auth/login";
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: t("VerifyEmail.errorMessage") });
        }
        setIsLoading(false);
    };

    return (
        <Card
            color={activeColor as CardColor}
            layout="auto"
            title={t("VerifyEmail.title")}
            footer={footer}
        >
            <div className="layout-auth-form mt-4">
                {message && (
                    <div className={`layout-auth-error ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}`}>
                        {message.type === 'error' ? <TriangleAlert className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                        <span>{message.text}</span>
                    </div>
                )}

                <Button
                    type="button"
                    className="layout-auth-submit"
                    onClick={handleCheckStatus}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : t("VerifyEmail.checkStatusButton")}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-2"
                    onClick={handleResend}
                    disabled={isLoading}
                >
                    {t("VerifyEmail.resendButton")}
                </Button>
            </div>
        </Card>
    );
}
