import type { Metadata } from "next";
import { getMessages, getLocale, getTranslations } from "next-intl/server";
import { AppProviders } from "@/providers/AppProviders";
import { CanvasOverlay } from "@/components/layout/CanvasOverlay";
import { ToolsOverlay } from "@/components/layout/ToolsOverlay";
import { BaseLogo } from "@/components/layout/base/BaseLogo";
import { BaseNavigator, NavItem } from "@/components/layout/base/BaseNavigator";
import { getTokens } from "next-firebase-auth-edge";
import { cookies } from "next/headers";
import { authConfig } from "@/core/auth-edge";
import type { RoleId } from "../../../functions/src/schemas/auth";
import "../globals.css";

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
        { url: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ffavicon-16x16.png?alt=media&token=4ee37fbe-5900-4e34-a971-83b9d6ca5003", sizes: "16x16", type: "image/png" },
        { url: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ffavicon-32x32.png?alt=media&token=58ecc23e-d2da-4df7-9278-54a3954828ff", sizes: "32x32", type: "image/png" },
        { url: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Ffavicon.ico?alt=media&token=e93c2add-25df-4287-8f9c-c767c6248c2f", sizes: "32x32", type: "image/x-icon" },
        { url: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Fandroid-chrome-192x192.png?alt=media&token=cf193cdd-6e33-4fc3-a481-34f40767e06e", sizes: "192x192", type: "image/png" },
        { url: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Fandroid-chrome-512x512.png?alt=media&token=bbc51527-a49c-4797-971b-b13268836f27", sizes: "512x512", type: "image/png" },
      ],
      apple: [
        { url: "https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Fapple-touch-icon.png?alt=media&token=9f73a768-67e8-4bb9-8942-8db21a54a9e0", sizes: "180x180", type: "image/png" },
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
  const uiModeCookie = cookieStore.get('ui_mode')?.value || 'tools';

  const tokens = await getTokens(cookieStore, authConfig);
  let variant: "public" | "protected" = "public";
  let navItems: NavItem[] = [];
  let roleContextLabel = "";
  let userName = "";
  let organizationName = "";

  if (tokens) {
    variant = "protected";
    const claims = (tokens.decodedToken || {}) as Record<string, unknown>;
    const role = (claims.role as string) || "pending";
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
    <html lang={locale} suppressHydrationWarning>
      <body className={`${montserrat.variable} font-sans antialiased layout-public-root fixed inset-0 overflow-hidden`}>
        <AppProviders locale={locale} messages={messages}>
          <CanvasOverlay active={uiModeCookie === 'canvas'} />
          <ToolsOverlay active={uiModeCookie === 'tools'}>
            {children}
          </ToolsOverlay>
          <BaseLogo />
          <BaseNavigator
            variant={variant}
            navItems={navItems}
            roleContext={roleContextLabel}
            userName={userName}
            organizationName={organizationName}
          />
        </AppProviders>
      </body>
    </html>
  );
}

