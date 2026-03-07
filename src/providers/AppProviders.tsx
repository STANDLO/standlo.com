"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { appCheck } from "@/core/firebase";
import { getToken } from "firebase/app-check";
import { APIProvider, useApiIsLoaded } from "@vis.gl/react-google-maps";

// Helper component to synchronize Firebase AppCheck token with Google Maps API
function GoogleAppCheckSync() {
    const isLoaded = useApiIsLoaded(); // Triggers re-render when Maps API is fully loaded

    React.useEffect(() => {
        function syncToken() {
            if (typeof window === "undefined" || !window.google?.maps || !appCheck) return;

            try {
                // Configure the App Check interceptor for Google Maps API
                // @ts-expect-error fetchAppCheckToken is not yet in @types/google.maps
                window.google.maps.Settings.getInstance().fetchAppCheckToken = () => getToken(appCheck, false);
                console.log("Firebase AppCheck token interceptor successfully configured for Google Maps API.");
            } catch (err) {
                console.error("Failed to configure AppCheck token interceptor for Google Maps:", err);
            }
        }

        // We run the sync every time the map instance changes (usually from null to loaded)
        // or just once on mount if the API was already globally available.
        if (isLoaded) {
            syncToken();
        }
    }, [isLoaded]);

    return null;
}

// Helper component to track session refreshes globally
function SessionTrackerSync() {
    React.useEffect(() => {
        if (typeof window === "undefined") return;

        let unsubscribe: () => void;

        import("@/core/firebase").then(({ auth, appCheck }) => {
            import("firebase/auth").then(({ onIdTokenChanged }) => {
                unsubscribe = onIdTokenChanged(auth, async (user) => {
                    if (user) {
                        try {
                            const sessionId = localStorage.getItem("standlo_session");
                            if (!sessionId) return; // Not tracked or fresh login handles it

                            const token = await user.getIdToken().catch(() => null);
                            if (!token) return;

                            const headers: Record<string, string> = {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            };

                            if (appCheck) {
                                try {
                                    const { getToken } = await import("firebase/app-check");
                                    const appCheckTokenResponse = await getToken(appCheck, false);
                                    if (appCheckTokenResponse.token) {
                                        headers["X-Firebase-AppCheck"] = appCheckTokenResponse.token;
                                    }
                                } catch {
                                    console.warn("Failed AppCheck token on background refresh");
                                }
                            }

                            // Emit session refresh telemetry without awaiting
                            fetch("/api/gateway", {
                                method: "POST",
                                headers,
                                body: JSON.stringify({
                                    actionId: "auth_event",
                                    payload: { type: "session_refresh", sessionId }
                                })
                            }).catch(() => { });
                        } catch {
                            console.error("Session refresh tracker failed");
                        }
                    }
                });
            });
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    return null;
}

export function AppProviders({
    children,
    messages,
    locale
}: {
    children: React.ReactNode;
    messages: AbstractIntlMessages;
    locale: string;
}) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Rome">
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""} libraries={['places']}>
                <GoogleAppCheckSync />
                <SessionTrackerSync />
                <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
                    {children}
                </NextThemesProvider>
            </APIProvider>
        </NextIntlClientProvider>
    );
}
