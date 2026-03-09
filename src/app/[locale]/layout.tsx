import type { Metadata } from "next";
import { getMessages, getLocale } from "next-intl/server";
import { AppProviders } from "@/providers/AppProviders";
import { Canvas } from "@/components/canvas/Canvas";
import "../globals.css";

import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Brand");
  return {
    title: `${t('name')} | ${t('slogan')}`,
    description: t('description'),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${montserrat.variable} font-sans antialiased layout-public-root fixed inset-0 overflow-hidden`}>
        <AppProviders locale={locale} messages={messages}>
          <Canvas />
          <div className="relative z-10 w-full h-full overflow-y-auto pointer-events-auto flex flex-col pt-24 px-8">
            {children}
          </div>
        </AppProviders>
      </body>
    </html>
  );
}

