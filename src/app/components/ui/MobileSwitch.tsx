"use client";

import { Button } from "@heroui/react";
import { Smartphone } from "lucide-react";

interface MobileSwitchProps {
  isMobile: boolean;
  onChange: (val: boolean) => void;
}

export function MobileSwitch({ isMobile, onChange }: MobileSwitchProps) {
  return (
    <Button
      isIconOnly
      color={isMobile ? "primary" : "default"}
      variant={isMobile ? "solid" : "bordered"}
      size="sm"
      onPress={() => onChange(!isMobile)}
      aria-label="Toggle Mobile View"
    >
      <Smartphone size={18} />
    </Button>
  );
}
