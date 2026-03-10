"use client";

import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { X } from "lucide-react";

export default function Home() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="ui-home">
      <div className="ui-home-exit" onClick={() => setIsVisible(false)} aria-label="Close">
        <X className="w-5 h-5" />
      </div>
      <div className="ui-home-logo">
        <Logo size="xxl" />
      </div>
    </div>
  );
}
