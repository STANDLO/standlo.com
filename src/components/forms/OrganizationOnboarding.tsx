"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useTheme } from "@/providers/ThemeProvider";
import { OrganizationCreateSchema, OrganizationTypeOptions, SystemRoleOptions } from "@/core/schemas";
import { auth, appCheck } from "@/core/firebase";
import { callGateway } from "@/lib/api";
import { signInWithCustomToken, onAuthStateChanged } from "firebase/auth";
import { getToken } from "firebase/app-check";
import { Card, CardColor } from "@/components/ui/Card";
import { useBrandColor } from "@/hooks/useBrandColor";
import { TriangleAlert, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { InputDate } from "@/components/ui/InputDate";
import { InputVat } from "@/components/ui/InputVat";
import { InputPlace } from "@/components/ui/InputPlace";
import { Gallery } from "@/components/ui/Gallery";
import { Button } from "@/components/ui/Button";

// Estendiamo lo schema base per l'onboarding frontend con zod
const OnboardingSchema = OrganizationCreateSchema.extend({
    birthday: z.string().min(1, "Campo obbligatorio"),
    name: z.string().min(1, "Campo obbligatorio"),
    displayName: z.string().min(1, "Campo obbligatorio"),
    roleId: z.string().min(1, "Campo obbligatorio"),
    type: z.union([z.string(), z.array(z.string())]).optional(),
});

type OnboardingFormData = z.infer<typeof OnboardingSchema>;

export function OrganizationOnboarding({ locale }: { locale: string }) {
    const t = useTranslations("Onboarding");
    const tBrand = useTranslations("Brand");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { color } = useBrandColor();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { theme: resolvedTheme } = useTheme();

    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [uid, setUid] = React.useState<string | null>(null);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUid(user?.uid || null);
        });
        return () => unsubscribe();
    }, []);

    const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<OnboardingFormData>({
        resolver: zodResolver(OnboardingSchema),
        defaultValues: {
            name: "",
            displayName: "",
            birthday: "",
            vatNumber: "",
            roleId: "",
            type: "",
            place: undefined,
            logoUrl: ""
        }
    });

    const translatedRoleOptions = SystemRoleOptions.map(opt => ({
        ...opt,
        label: t(`roleOptions.${opt.value}`, { fallback: opt.label })
    }));

    const translatedTypeOptions = OrganizationTypeOptions.map(opt => ({
        ...opt,
        label: t(`orgTypeOptions.${opt.value}`, { fallback: opt.label })
    }));

    const onSubmit = async (formData: OnboardingFormData) => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Pre-sanitize data to prevent Zod errors for undefined values masqueraded as empty strings
            const sanitizedPayload = { ...formData };
            if (sanitizedPayload.type === "") sanitizedPayload.type = undefined;
            if (sanitizedPayload.roleId === "") sanitizedPayload.roleId = undefined;
            if (sanitizedPayload.vatNumber === "") sanitizedPayload.vatNumber = undefined;
            if (sanitizedPayload.logoUrl === "") sanitizedPayload.logoUrl = undefined;
            
            if (sanitizedPayload.place && typeof sanitizedPayload.place === "object") {
                const p = sanitizedPayload.place as Record<string, string | undefined>;
                if (!p.fullAddress && !p.address && !p.city && !p.country && !p.zipCode) {
                    sanitizedPayload.place = undefined;
                }
            }

            const data = await callGateway<{ status: string, message?: string, customToken?: string }>("orchestrator", {
                actionId: "onboard_organization",
                payload: sanitizedPayload
            });

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

                // Check for and claim public Canvas Sandbox
                const savedCanvasId = localStorage.getItem("standlo_active_sandbox_canvas");
                if (savedCanvasId) {
                    try {
                        await callGateway("orchestrator", { actionId: "claimCanvasSandbox", payload: { canvasId: savedCanvasId } });
                        localStorage.removeItem("standlo_active_sandbox_canvas");
                    } catch (err) {
                        console.error("Failed to claim canvas", err);
                    }
                }

                // Log the final onboarding completion step to the Orchestrator
                const sessionId = localStorage.getItem("standlo_session");
                if (sessionId) {
                    await callGateway("orchestrator", {
                        actionId: "auth_event",
                        payload: { type: "onboarding", sessionId }
                    }).catch(() => { });
                }
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

    const footer = (
        <div className="ui-card-onboarding-footer">
            {tBrand("copyright", { year: new Date().getFullYear() })}
        </div>
    );

    return (
        <Card
            color={"default" as CardColor}
            layout="auto"
            title={t("title")}
            footer={footer}
        >
            <div id="recaptcha-container"></div>

            <div className="ui-card-onboarding-wrapper">
                {error && (
                    <div className="ui-card-onboarding-error">
                        <TriangleAlert className="ui-card-onboarding-alert-icon" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="ui-card-onboarding-form">
                    <div className="ui-card-onboarding-grid">
                        {/* Row 1: VAT (Left), Name (Right) */}
                        <Controller
                            name="vatNumber"
                            control={control}
                            render={({ field }) => (
                                <InputVat
                                    id="vatNumber"
                                    label={t("vatLabel")}
                                    disabled={isSubmitting}
                                    value={field.value as string | undefined}
                                    onChange={field.onChange}
                                    onViesData={(viesData) => {
                                        if (viesData.name) {
                                            setValue("name", viesData.name, { shouldValidate: true });
                                            // Optional: also default displayName if not set and wanted
                                        }
                                        if (viesData.address) {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            setValue("place", viesData.address as any, { shouldValidate: true });
                                        }
                                    }}
                                />
                            )}
                        />
                        <Input
                            id="name"
                            label={t("orgNameLabel")}
                            placeholder="Es. Mario Rossi o Nome Azienda"
                            error={errors.name?.message}
                            disabled={isSubmitting}
                            required
                            {...register("name")}
                        />

                        {/* Row 2: Type (Left), Role (Right) */}
                        <Select
                            id="type"
                            label={t("orgTypeLabel")}
                            disabled={isSubmitting}
                            options={[{ value: "", label: "Seleziona..." }, ...translatedTypeOptions]}
                            error={errors.type?.message as string | undefined}
                            {...register("type")}
                        />
                        <Select
                            id="roleId"
                            label={t("roleLabel")}
                            disabled={isSubmitting}
                            options={[{ value: "", label: "Seleziona..." }, ...translatedRoleOptions]}
                            error={errors.roleId?.message}
                            required
                            {...register("roleId")}
                        />

                        {/* Row 3: Display Name (Left), Birthday (Right) */}
                        <Input
                            id="displayName"
                            label={t("displayNameLabel")}
                            placeholder="Nome / Nickname"
                            error={errors.displayName?.message}
                            disabled={isSubmitting}
                            required
                            {...register("displayName")}
                        />
                        <InputDate
                            id="birthday"
                            label={t("birthdayLabel")}
                            error={errors.birthday?.message}
                            disabled={isSubmitting}
                            required
                            {...register("birthday")}
                        />
                    </div>

                    {/* Row 4: Address (InputPlace) */}
                    <Controller
                        name="place"
                        control={control}
                        render={({ field }) => (
                            <InputPlace
                                id="place"
                                label={t("addressLabel")}
                                disabled={isSubmitting}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                value={field.value as any}
                                onPlaceSelect={field.onChange}
                            />
                        )}
                    />

                    {/* Logo (Gallery) */}
                    <Controller
                        name="logoUrl"
                        control={control}
                        render={({ field }) => (
                            <div className="ui-card-onboarding-gallery">
                                <label className="ui-card-onboarding-label">{t("logoLabel")}</label>
                                <Gallery
                                    maxFiles={1}
                                    value={field.value ? [field.value as string] : []}
                                    onChange={(urls) => field.onChange(urls[0] || "")}
                                    path={uid ? `users/${uid}/gallery` : ""}
                                />
                            </div>
                        )}
                    />

                    <div className="ui-card-onboarding-actions">
                        <Button type="submit" disabled={isSubmitting} variant="default" className="ui-card-onboarding-submit">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : t("submitButton") + " ->"}
                        </Button>
                    </div>
                </form>
            </div>
        </Card>
    );
}
