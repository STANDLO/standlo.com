"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { HeroUIProvider } from "@heroui/react";
import { useRouter } from "next/navigation";
import { APIProvider, useApiIsLoaded } from "@vis.gl/react-google-maps";
import { appCheck } from "@core/firebase";
import { getToken } from "firebase/app-check";
import { SyncProvider } from "@/components/Sync";
import { DcodeSync } from "@/components/DcodeSync";
import { syncPayload } from "@schemas/sync";


function GoogleAppCheckSync() {
    const isLoaded = useApiIsLoaded();

    React.useEffect(() => {
        function syncToken() {
            if (typeof window === "undefined" || !window.google?.maps || !appCheck) return;
            try {
                // @ts-expect-error fetchAppCheckToken is not yet in @types/google.maps
                window.google.maps.Settings.getInstance().fetchAppCheckToken = () => getToken(appCheck, false);
            } catch (err) {
                console.error("Failed to configure AppCheck:", err);
            }
        }
        if (isLoaded) syncToken();
    }, [isLoaded]);

    return null;
}

function SessionTrackerSync() {
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        let unsubscribe: () => void;

        import("@core/firebase").then(({ auth }) => {
            import("firebase/auth").then(({ onIdTokenChanged }) => {
                unsubscribe = onIdTokenChanged(auth, async (user) => {
                    if (user) {
                        try {
                            const sessionId = localStorage.getItem("standlo_session");
                            if (!sessionId) return;
                            const token = await user.getIdToken().catch(() => null);
                            if (!token) return;

                            // Session refreshed successfully. API usage removed for V2.
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

import { set, createStore } from "idb-keyval";
const customStore = createStore("STANDLO", "preferences");

function SystemTrackerSync({ locale, version }: { locale: string; version: string }) {
    React.useEffect(() => {
        if (typeof window === "undefined") return;
        set("system.context", { locale, version }, customStore).catch(console.error);
    }, [locale, version]);

    return null;
}

export function Providers({
    children,
    locale,
    version
}: {
    children: React.ReactNode;
    locale: string;
    version: string;
}) {
    const router = useRouter();

    return (
        <HeroUIProvider navigate={router.push}>
            <NextThemesProvider attribute="class" defaultTheme="light">
                <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""} libraries={['places']}>
                    <GoogleAppCheckSync />
                    <SessionTrackerSync />
                    <SystemTrackerSync locale={locale} version={version} />
                    <SyncProvider payload={syncPayload} />
                    <DcodeSync />
                    {children}
                </APIProvider>
            </NextThemesProvider>
        </HeroUIProvider>
    );
}
