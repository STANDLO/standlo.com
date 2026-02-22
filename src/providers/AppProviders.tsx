"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import "@/core/firebase"; // Inizializza immediatamente AppCheck e Firebase App sul client.

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
            <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
                {children}
            </NextThemesProvider>
        </NextIntlClientProvider>
    );
}
