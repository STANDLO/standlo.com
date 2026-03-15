import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Main } from "@/components/Main";
import pkg from "../../../package.json";
import "../globals.css";

import { Translations } from "@schemas/translation";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale() as string;
  return {
    title: `${Translations('Brand', 'name', null as unknown as string, locale)} | ${Translations('Brand', 'slogan', null as unknown as string, locale)}`,
    description: Translations('Brand', 'description', null as unknown as string, locale),
    icons: {
      icon: [
        { url: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ffavicon-16x16.png?alt=media&token=b075b69e-d112-4ac8-a6c5-c11c3a0a7916", sizes: "16x16", type: "image/png" },
        { url: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ffavicon-32x32.png?alt=media&token=5e3c56af-2cb4-4788-a9e9-c5695719c9c8", sizes: "32x32", type: "image/png" },
        { url: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ffavicon.ico?alt=media&token=59d9b287-5671-4f7a-915d-9902cfdd8ebc", sizes: "32x32", type: "image/x-icon" },
        { url: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Fandroid-chrome-192x192.png?alt=media&token=8832045c-c2aa-47ba-ad44-5af9313362f8", sizes: "192x192", type: "image/png" },
        { url: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Fandroid-chrome-512x512.png?alt=media&token=e314a8bb-fea5-4f9f-bb44-a364ade58211", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Fapple-touch-icon.png?alt=media&token=60c95948-1318-407f-8951-d6f97bc83289", sizes: "180x180", type: "image/png" },
      ],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`bg-dotted font-sans antialiased text-foreground bg-background fixed inset-0 overflow-hidden`}>
        <Providers locale={locale} version={pkg.version}>
            <div className="flex flex-col h-screen w-full relative">
                <Header />
                <Main>
                    {children}
                </Main>
            </div>
        </Providers>
      </body>
    </html>
  );
}
