"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Globe } from "lucide-react";
import { Locales } from "@schemas/locale";
import { useIdbState } from "@/hooks/useIdbState";

interface LocaleSwitchProps {
  currentLocale: string;
}

export function LocaleSwitch({ currentLocale }: LocaleSwitchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [, setPersistedLocale] = useIdbState("STANDLO.system.locale", currentLocale);

  const handleAction = (key: React.Key) => {
    const nextLocale = key as string;
    if (nextLocale === currentLocale) return;
    
    setPersistedLocale(nextLocale);
    
    // Fallback naive replacer for next-intl standard routing
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "");
    const newPath = `/${nextLocale}${pathWithoutLocale === "" ? "/" : pathWithoutLocale}`;
    router.replace(newPath);
  };

  const activeLocaleData = Locales.find(l => l.id === currentLocale) || Locales[0];

  return (
    <Dropdown>
      <DropdownTrigger>
        <div 
          className="flex items-center justify-center gap-1.5 border-medium border-default-200 hover:bg-default-100 px-2 h-8 text-sm rounded-medium transition-colors cursor-pointer"
          aria-label="Select Language"
        >
          <Globe size={16} className="text-default-500" />
          <span className="text-base leading-none">{activeLocaleData.flag}</span>
        </div>
      </DropdownTrigger>
      
      <DropdownMenu 
        aria-label="Language selection" 
        onAction={handleAction} 
        selectedKeys={new Set([currentLocale])}
        selectionMode="single"
        items={Locales}
      >
        {(loc: { id: string, nativeLabel: string, flag: string }) => (
          <DropdownItem 
            key={loc.id} 
            textValue={loc.nativeLabel}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{loc.flag}</span>
              <span>{loc.nativeLabel}</span>
            </div>
          </DropdownItem>
        )}
      </DropdownMenu>
    </Dropdown>
  );
}
