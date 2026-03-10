"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    User,
    getMultiFactorResolver,
    PhoneAuthProvider,
    PhoneMultiFactorGenerator,
    RecaptchaVerifier,
    multiFactor,
    MultiFactorResolver
} from "firebase/auth";
import { auth, appCheck } from "@/core/firebase";
import { getToken } from "firebase/app-check";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardColor, CardDivider } from "@/components/ui/Card";
import { CardAuthSocials } from "@/components/ui/CardAuthSocials";
import { useBrandColor } from "@/hooks/useBrandColor";
import { Link } from "@/i18n/routing";
type MfaStep = "login" | "sms_prompt" | "enroll_prompt" | "enroll_verify";

declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recaptchaVerifier: any;
    }
}

export function FormLogin() {
    const t = useTranslations("Auth");
    const { resolvedTheme } = useTheme();
    const btnVariant = resolvedTheme === "dark" ? "dark" : "light";

    const tBrand = useTranslations("Brand");
    const { color } = useBrandColor();
    const activeColor = color === "default" ? "green" : color;

    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

    const footerText = t("noAccountText");
    const footerHref = "/auth/create";
    const footerActionText = t("registerAction");

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

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("registered") === "true") {
                setSuccessMsg(t("registrationSuccess"));
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }, [t]);

    // MFA States
    const [mfaStep, setMfaStep] = React.useState<MfaStep>("login");
    const [mfaResolver, setMfaResolver] = React.useState<MultiFactorResolver | null>(null);
    const [verificationId, setVerificationId] = React.useState<string | null>(null);
    const [phoneNumber, setPhoneNumber] = React.useState("");
    const [otp, setOtp] = React.useState("");
    const [pendingUser, setPendingUser] = React.useState<User | null>(null);

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
        // Enforce forced enrollment if user has no MFA factors, but ONLY for email/password users
        const isSocialLogin = user.providerData.some(
            (p) => p.providerId === "google.com" || p.providerId === "github.com"
        );

        if (!isSocialLogin && multiFactor(user).enrolledFactors.length === 0) {
            setPendingUser(user);
            setMfaStep("enroll_prompt");
            setIsLoading(false);
            return;
        }

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
            try {
                let sessionId = localStorage.getItem("standlo_session");
                if (!sessionId) {
                    sessionId = crypto.randomUUID();
                    localStorage.setItem("standlo_session", sessionId);
                }
                const trackHeaders: Record<string, string> = {
                    "Content-Type": "application/json",
                    ...headers
                };
                fetch("/api/gateway?target=orchestrator", {
                    method: "POST",
                    headers: trackHeaders,
                    body: JSON.stringify({
                        actionId: "auth_event",
                        payload: { type: "login", sessionId }
                    })
                }).catch(e => console.error("Auth tracker error:", e));
            } catch (e) {
                console.error("Session init error:", e);
            }

            window.location.href = "/";
        } else {
            setError("Failed to create session. Please try again.");
            setIsLoading(false);
        }
    };

    const initializeRecaptcha = (containerId: string) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        if (!win.recaptchaVerifier) {
            win.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
                size: 'invisible',
                callback: () => {
                    // reCAPTCHA solved
                }
            });
        }
        return win.recaptchaVerifier;
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await handleLoginSuccess(userCredential.user);
        } catch (err: unknown) {
            if (typeof err === "object" && err !== null && (err as { code: string }).code === "auth/multi-factor-auth-required") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const resolver = getMultiFactorResolver(auth, err as any);
                setMfaResolver(resolver);

                // Automatically send SMS to the first hint
                if (resolver.hints[0] && resolver.hints[0].factorId === PhoneMultiFactorGenerator.FACTOR_ID) {
                    const phoneInfoOptions = {
                        multiFactorHint: resolver.hints[0],
                        session: resolver.session
                    };
                    const recaptcha = initializeRecaptcha('recaptcha-container');
                    const phoneAuthProvider = new PhoneAuthProvider(auth);
                    try {
                        const vid = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, recaptcha);
                        setVerificationId(vid);
                        setMfaStep("sms_prompt");
                        setIsLoading(false);
                    } catch (mfaErr) {
                        handleError(mfaErr);
                    }
                } else {
                    setError("MFA method not supported.");
                    setIsLoading(false);
                }
            } else {
                handleError(err);
            }
        }
    };

    const verifyMfaOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mfaResolver || !verificationId || !otp) return;
        setIsLoading(true);
        setError(null);

        try {
            const cred = PhoneAuthProvider.credential(verificationId, otp);
            const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
            const userCredential = await mfaResolver.resolveSignIn(multiFactorAssertion);
            await handleLoginSuccess(userCredential.user);
        } catch (err) {
            handleError(err);
        }
    };

    const handleEnrollmentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pendingUser || !phoneNumber) return;
        setIsLoading(true);
        setError(null);

        try {
            const recaptcha = initializeRecaptcha('recaptcha-container');
            const session = await multiFactor(pendingUser).getSession();
            const phoneAuthProvider = new PhoneAuthProvider(auth);
            const vid = await phoneAuthProvider.verifyPhoneNumber({
                phoneNumber: phoneNumber,
                session: session
            }, recaptcha);
            setVerificationId(vid);
            setMfaStep("enroll_verify");
            setIsLoading(false);
        } catch (err) {
            handleError(err);
        }
    };

    const verifyEnrollmentOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pendingUser || !verificationId || !otp) return;
        setIsLoading(true);
        setError(null);

        try {
            const cred = PhoneAuthProvider.credential(verificationId, otp);
            const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(cred);
            await multiFactor(pendingUser).enroll(multiFactorAssertion, "Primary Phone");
            await handleLoginSuccess(pendingUser);
        } catch (err) {
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
        <Card
            color={activeColor as CardColor}
            layout="auto"
            title={t("title")}
            footer={footer}
        >
            <div id="recaptcha-container"></div>

            {mfaStep === "login" && (
                <form onSubmit={onSubmit} className="layout-auth-form">
                    <CardAuthSocials
                        onGoogleLogin={loginWithGoogle}
                        onGithubLogin={loginWithGithub}
                        isLoading={isLoading}
                    />

                    {successMsg && (
                        <div className="layout-auth-error !bg-green-50/50 !text-green-600 !border-green-200">
                            <span>{successMsg}</span>
                        </div>
                    )}
                    {error && (
                        <div className="layout-auth-error">
                            <TriangleAlert className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
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

                    <CardDivider>{t("loginDividerText")}</CardDivider>
                    <Button type="submit" variant={btnVariant} className="layout-auth-submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : t("submitButton")}
                    </Button>
                </form>
            )}

            {mfaStep === "sms_prompt" && (
                <form onSubmit={verifyMfaOtp} className="layout-auth-form">
                    {error && (
                        <div className="layout-auth-error">
                            <TriangleAlert className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground mb-4">
                        {t("mfaVerifyMessage")}
                    </p>

                    <Input
                        id="otp"
                        type="text"
                        label={`${t("otpLabel")} *`}
                        containerClassName="layout-auth-field"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        disabled={isLoading}
                    />

                    <Button type="submit" variant={btnVariant} className="layout-auth-submit mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : t("verifyAccessButton")}
                    </Button>
                </form>
            )}

            {mfaStep === "enroll_prompt" && (
                <form onSubmit={handleEnrollmentSubmit} className="layout-auth-form">
                    {error && (
                        <div className="layout-auth-error">
                            <TriangleAlert className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground mb-4">
                        {t("mfaEnrollMessage")}
                    </p>

                    <Input
                        id="phoneNumber"
                        type="tel"
                        label={`${t("phoneNumberLabel")} *`}
                        containerClassName="layout-auth-field"
                        placeholder="+393331234567"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        disabled={isLoading}
                    />

                    <Button type="submit" variant={btnVariant} className="layout-auth-submit mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : t("sendVerificationSmsButton")}
                    </Button>
                </form>
            )}

            {mfaStep === "enroll_verify" && (
                <form onSubmit={verifyEnrollmentOtp} className="layout-auth-form">
                    {error && (
                        <div className="layout-auth-error">
                            <TriangleAlert className="h-4 w-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <p className="text-sm text-muted-foreground mb-4">
                        {t("mfaEnrollVerifyMessage")}
                    </p>

                    <Input
                        id="enroll-otp"
                        type="text"
                        label={`${t("otpLabel")} *`}
                        containerClassName="layout-auth-field"
                        placeholder="123456"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        disabled={isLoading}
                    />

                    <Button type="submit" variant={btnVariant} className="layout-auth-submit mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : t("completeRegistrationButton")}
                    </Button>
                </form>
            )}

        </Card>
    );
}
