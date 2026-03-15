"use client";

import * as React from "react";
import { Link, Button, Tooltip } from "@heroui/react";
import Image from "next/image";
import { User, Menu } from "lucide-react";
import { Modules } from "@schemas/module";
import { Translations } from "@schemas/translation";
import { useParams } from "next/navigation";
import { useIdbState } from "@/hooks/useIdbState";
import { AppSwitch } from "@ui/AppSwitch";
import { LocaleSwitch } from "@ui/LocaleSwitch";
import { ThemeSwitch } from "@ui/ThemeSwitch";
import { MobileSwitch } from "@ui/MobileSwitch";

function HeaderLogo() {
  const { locale } = useParams() as { locale: string };

  return (
    <Link href={`/${locale || "en"}/home`} className="block text-foreground shrink-0">
      <Image 
        src="https://firebasestorage.googleapis.com/v0/b/standlo.firebasestorage.app/o/public%2Fandroid-chrome-512x512.png?alt=media&token=e314a8bb-fea5-4f9f-bb44-a364ade58211" 
        alt="Standlo Logo" 
        width={32}
        height={32}
        className="w-8 h-8 rounded-md"
      />
    </Link>
  );
}

function HeaderNav({ isMobile, isGuest }: { isMobile: boolean, isGuest: boolean }) {
  const { locale } = useParams() as { locale: string };

  if (isMobile) {
    return (
      <Button isIconOnly variant="ghost" aria-label="Menu">
        <Menu size={24} />
      </Button>
    );
  }

  // 1. Filter: Belongs to `nav===true`, and auth checks (`public===true` if guest)
  // 2. Sort: By `order` ascending
  const visibleModules = Modules.filter((mod) => {
    if (mod.nav === false) return false;
    if (isGuest && !mod.public) return false; // Hide private modules from unauthenticated guests
    return true;
  }).sort((a, b) => (a.order || 10) - (b.order || 10));

  return (
    <div className="flex items-center gap-2">
      {visibleModules.map((mod) => (
        <Tooltip 
          key={mod.id} 
          delay={100} 
          content={Translations("system", "modules", mod.id as string, locale)}
          placement="bottom"
          classNames={{ content: "capitalize text-xs font-medium px-2 py-1" }}
        >
          <Link 
            href={`/${locale || "en"}/${mod.id}/list/default`} 
            className="text-foreground hover:text-primary transition-colors flex items-center justify-center p-2 rounded-medium hover:bg-default-100"
          >
            {mod.iconNode}
          </Link>
        </Tooltip>
      ))}
    </div>
  );
}

function HeaderSystem({ isMobile, setIsMobile }: { isMobile: boolean, setIsMobile: (val: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      {!isMobile && (
        <>
          <AppSwitch />
          <LocaleSwitch currentLocale="en" />
          <ThemeSwitch />
        </>
      )}
      <MobileSwitch isMobile={isMobile} onChange={setIsMobile} />
    </div>
  );
}

function HeaderAccount({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Button isIconOnly variant="ghost" aria-label="Login">
        <User size={20} />
      </Button>
      {!isMobile && (
        <Button color="primary" variant="solid" className="font-medium">
          Registrati
        </Button>
      )}
    </div>
  );
}

export function Header() {
  const [isMobileState, setIsMobileState, isMobileReady] = useIdbState<boolean>("STANDLO.system.mobile", false);
  const [isWindowMobile, setIsWindowMobile] = React.useState(false);
  
  React.useEffect(() => {
    const handleResize = () => setIsWindowMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // TODO: Replace with global authentication context. For now, defaulting to true to simulate guest logic
  const isGuest = true;

  const isMobile = !isMobileReady ? false : (isMobileState || isWindowMobile);

  return (
    <div className="w-full h-16 border-b border-default-200 bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 md:px-6">
      {/* Left */}
      <div className="flex items-center gap-4 md:gap-8">
        {isMobile && <HeaderNav isMobile={isMobile} isGuest={isGuest} />}
        <HeaderLogo />
        {!isMobile && <HeaderNav isMobile={isMobile} isGuest={isGuest} />}
      </div>
      
      {/* Right */}
      <div className="flex items-center gap-2 md:gap-4">
        <HeaderSystem isMobile={isMobile} setIsMobile={setIsMobileState} />
        <div className="w-px h-6 bg-default-200 hidden sm:block" />
        <HeaderAccount isMobile={isMobile} />
      </div>
    </div>
  );
}
