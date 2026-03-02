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
                <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
                    {children}
                </NextThemesProvider>
            </APIProvider>
        </NextIntlClientProvider>
    );
}
