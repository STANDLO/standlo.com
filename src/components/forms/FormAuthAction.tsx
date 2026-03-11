"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { applyActionCode } from "firebase/auth";
import { auth, appCheck } from "@/core/firebase";
import { getToken } from "firebase/app-check";
import { useTranslations } from "next-intl";
import { Card, CardColor } from "@/components/ui/Card";
import { useBrandColor } from "@/hooks/useBrandColor";
import { Loader2 } from "lucide-react";

export function FormAuthAction({ locale }: { locale: string }) {
    const t = useTranslations("Auth");
    const router = useRouter();
    const searchParams = useSearchParams();
    const hasHandled = React.useRef(false);

    const tBrand = useTranslations("Brand");
    const { color } = useBrandColor();
    const activeColor = color === "default" ? "green" : color;

    const footer = (
        <div className="ui-card-auth-copyright">
            {tBrand("copyright", { year: new Date().getFullYear() })}
        </div>
    );

    const [status, setStatus] = React.useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = React.useState<string>("");

    React.useEffect(() => {
        const mode = searchParams.get("mode");
        const actionCode = searchParams.get("oobCode");

        if (!mode || !actionCode) {
            setStatus("error");
            setMessage(t("Action.invalidLink", { fallback: "Invalid or missing action code." }));
            return;
        }

        const handleAction = async () => {
            try {
                if (mode === "resetPassword") {
                    // Password reset logic - handled here or redirect to a dedicated form
                    // Example: router.push(`/${locale}/auth/reset-password?oobCode=${actionCode}`);
                    setStatus("error");
                    setMessage("Password reset handling not currently implemented in this view.");
                } else if (mode === "recoverEmail") {
                    // Email recovery logic
                    setStatus("error");
                    setMessage("Email recovery handling not currently implemented in this view.");
                } else if (mode === "verifyEmail") {
                    // Verify the email address
                    await applyActionCode(auth, actionCode);

                    if (auth.currentUser) {
                        // Resync local token
                        await auth.currentUser.reload();
                        const token = await auth.currentUser.getIdToken(true);

                        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
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

                        // Update Edge cookie session so proxy.ts gets the new 'email_verified' claim
                        await fetch("/api/auth/login", { headers });

                        // Log verification event to orchestrator
                        const sessionId = localStorage.getItem("standlo_session");
                        if (sessionId) {
                            import("@/lib/api").then(({ callGateway }) => {
                                callGateway("orchestrator", {
                                    actionId: "auth_event",
                                    payload: { type: "verify", sessionId }
                                }).catch(() => {});
                            });
                        }

                        setStatus("success");
                        setMessage(t("VerifyEmail.successMessage", { fallback: "Email verified successfully! Redirecting..." }));
                        setTimeout(() => {
                            router.push(`/${locale}/onboarding`);
                        }, 2000);
                    } else {
                        setStatus("success");
                        setMessage(t("VerifyEmail.successMessage", { fallback: "Email verified successfully! Redirecting..." }));
                        // Auto-redirect to login after verification
                        setTimeout(() => {
                            router.push(`/${locale}/auth/login?verified=true`);
                        }, 2000);
                    }
                } else {
                    setStatus("error");
                    setMessage(t("Action.invalidMode", { fallback: "Unknown action mode." }));
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                console.error("Error processing Auth Action:", error);

                // Se il codice è già stato usato (es. utente ha cliccato due volte, o Strict Mode react 18)
                if (mode === "verifyEmail" && error.code === "auth/invalid-action-code") {
                    setStatus("success");
                    setMessage(t("VerifyEmail.alreadyVerified", { fallback: "Email already verified! Redirecting..." }));
                    setTimeout(() => {
                        router.push(`/${locale}/auth/login?verified=true`);
                    }, 2000);
                    return;
                }

                setStatus("error");
                setMessage(error.message || t("Action.errorMessage", { fallback: "An error occurred while processing your request." }));
            }
        };

        if (!hasHandled.current) {
            hasHandled.current = true;
            handleAction();
        }
    }, [searchParams, router, locale, t]);

    return (
        <Card
            color={activeColor as CardColor}
            layout="auto"
            title={t("Action.title", { fallback: "Processing Request" })}
            footer={footer}
        >
            <div className="layout-auth-form mt-4 flex flex-col items-center justify-center p-6 text-center">
                {status === "loading" && (
                    <div className="flex flex-col items-center text-slate-400">
                        <Loader2 className="animate-spin w-8 h-8 mb-4 text-emerald-500" />
                        <p>{t("Action.loading", { fallback: "Verifying the code..." })}</p>
                    </div>
                )}
                {status === "success" && (
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-emerald-400">{message}</p>
                    </div>
                )}
                {status === "error" && (
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </div>
                        <p className="text-red-400">{message}</p>
                    </div>
                )}
            </div>
        </Card>
    );
}
