import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import usMessages from "../../messages/us.json";
import { Sidebar } from "./components/Sidebar";
import { AdminAuthGuard } from "./components/AdminAuthGuard";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Standlo Admin Studio",
  description: "Internal Control Panel & Visual IDE",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-[#f7f9fc] dark:bg-[#0e0e11] text-foreground`}>
        <NextIntlClientProvider locale="us" messages={usMessages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AdminAuthGuard>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-white dark:bg-[#1a1a1f] shadow-[-10px_0_20px_rgba(0,0,0,0.02)] border-l border-[#e3e8ee] dark:border-zinc-800 relative z-10 m-2 rounded-xl ring-1 ring-zinc-200/50 dark:ring-zinc-800/50">
                  {children}
                </main>
              </div>
            </AdminAuthGuard>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
