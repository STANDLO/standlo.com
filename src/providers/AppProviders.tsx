"use client";

import * as React from "react";
import { ThemeProvider } from "./ThemeProvider";
import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { appCheck } from "@/core/firebase";
import { getToken } from "firebase/app-check";
import { APIProvider, useApiIsLoaded } from "@vis.gl/react-google-maps";
import { set } from "idb-keyval";

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
                // token interceptor successfully configured for Google Maps API
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

        import("@/core/firebase").then(({ auth }) => {
            import("firebase/auth").then(({ onIdTokenChanged }) => {
                unsubscribe = onIdTokenChanged(auth, async (user) => {
                    if (user) {
                        try {
                            const sessionId = localStorage.getItem("standlo_session");
                            if (!sessionId) return; // Not tracked or fresh login handles it

                            const token = await user.getIdToken().catch(() => null);
                            if (!token) return;

                            // Emit session refresh telemetry without awaiting
                            import("@/lib/api").then(({ callGateway }) => {
                                callGateway("orchestrator", {
                                    actionId: "auth_event",
                                    payload: { type: "session_refresh", sessionId }
                                }).catch(() => {});
                            });
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

// Helper component to synchronize system variables to IndexedDB
function SystemTrackerSync({ locale, theme, mode, version }: { locale: string; theme: string; mode: string; version: string }) {
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        set("system", { locale, theme, mode, version }).catch(console.error);
    }, [locale, theme, mode, version]);

    return null;
}

export function AppProviders({
    children,
    messages,
    locale,
    uiTheme,
    uiMode,
    version
}: {
    children: React.ReactNode;
    messages: AbstractIntlMessages;
    locale: string;
    uiTheme: "light" | "dark";
    uiMode: string;
    version: string;
}) {
    return (
        <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Rome">
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""} libraries={['places']}>
                <GoogleAppCheckSync />
                <SessionTrackerSync />
                <SystemTrackerSync locale={locale} theme={uiTheme} mode={uiMode} version={version} />
                <ThemeProvider initialTheme={uiTheme}>
                    {children}
                </ThemeProvider>
            </APIProvider>
        </NextIntlClientProvider>
    );
}
