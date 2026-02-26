"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import "@/core/firebase"; // Inizializza immediatamente AppCheck e Firebase App sul client.
import { APIProvider } from "@vis.gl/react-google-maps";

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
                <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
                    {children}
                </NextThemesProvider>
            </APIProvider>
        </NextIntlClientProvider>
    );
}
