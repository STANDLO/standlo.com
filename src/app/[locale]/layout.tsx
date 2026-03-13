import type { Metadata } from "next";
import { getMessages, getLocale, getTranslations } from "next-intl/server";
import { AppProviders } from "@/providers/AppProviders";
import { BaseLogo } from "@/components/layout/base/BaseLogo";
import { BaseNavigator, NavItem } from "@/components/layout/base/BaseNavigator";
import { BaseVersion } from "@/components/layout/base/BaseVersion";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/core/auth-edge";
import type { RoleId } from "../../../functions/src/schemas/auth";
import "../globals.css";
import pkg from "../../../package.json";

import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Brand");
  return {
    title: `${t('name')} | ${t('slogan')}`,
    description: t('description'),
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
  const messages = await getMessages();
  const t = await getTranslations("components");

  const cookieStore = await cookies();
  const uiModeCookieRaw = cookieStore.get('ui_mode')?.value || 'home'; // Default is now home
  const uiThemeCookieRaw = (cookieStore.get('ui_theme')?.value as "light" | "dark") || 'light';

  const tokens = await getTokens(cookieStore, authConfig);
  let variant: "public" | "protected" = "public";
  let navItems: NavItem[] = [];
  let roleContextLabel = "";
  let userName = "";
  let organizationName = "";
  let hasToolsAccess = false;

  if (tokens) {
    variant = "protected";
    const claims = (tokens.decodedToken || {}) as Record<string, unknown>;
    const role = (claims.role as string) || "pending";
    const isActive = claims.active === true;

    // Determine if user has permission to use the 'tools' mode
    if (isActive && role !== "pending") {
      hasToolsAccess = true;
    }

    userName = (claims.name as string) || (claims.email as string) || "Utente Standlo";
    organizationName = (claims.orgName as string) || "Ospite";

    let rawNavigation: Array<{ labelKey: string, path: string, icon?: string, matchPattern?: string }> = [];

    if (role === "pending") {
      roleContextLabel = "In attesa";
    } else {
      try {
        const { generateNavigationManifest } = await import("../../../functions/src/rbac/policyEngine");
        rawNavigation = generateNavigationManifest(role as RoleId);
      } catch (err) {
        console.error("[SSR] Failed to generate navigation context from internal Policy Engine:", err);
      }
      roleContextLabel = t(`roles.${role}`);
    }

    navItems = rawNavigation.map(item => ({
      label: t(item.labelKey) || item.labelKey,
      href: item.path,
      icon: item.icon as string,
      matchPattern: item.matchPattern
    }));

    const userType = claims.type as string;
    const organizationType = claims.organizationType as string;

    if (userType === "ADMIN" && role !== "pending" && organizationType === "BUSINESS") {
      navItems.push({
        label: "Team",
        href: `/users`,
        icon: "Users",
        matchPattern: `/users`
      });
    }
  }

  return (
    <html lang={locale} className={uiThemeCookieRaw} suppressHydrationWarning>
      <body className={`${montserrat.variable} bg-dotted font-sans antialiased layout-public-root fixed inset-0 overflow-hidden`}>
        <AppProviders locale={locale} messages={messages} uiTheme={uiThemeCookieRaw} uiMode={uiModeCookieRaw} version={pkg.version}>
          {children}
          <BaseLogo />
          <BaseNavigator
            variant={variant}
            navItems={navItems}
            roleContext={roleContextLabel}
            userName={userName}
            organizationName={organizationName}
            hasToolsAccess={hasToolsAccess}
          />
          <BaseVersion />
        </AppProviders>
      </body>
    </html>
  );
}
