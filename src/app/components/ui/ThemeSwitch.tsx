"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Button } from "@heroui/react";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button isIconOnly variant="bordered" size="sm" aria-label="Loading theme..." isDisabled>
        <div className="w-4 h-4 border-2 border-default-400 border-t-transparent rounded-full animate-spin" />
      </Button>
    );
  }

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else setTheme("light"); // We can cycle through system as well if needed later
  };

  return (
    <Button
      isIconOnly
      variant="bordered"
      size="sm"
      onPress={toggleTheme}
      aria-label="Toggle Theme"
      className="bg-transparent"
    >
      {theme === "light" ? <Sun size={18} /> : theme === "dark" ? <Moon size={18} /> : <Monitor size={18} />}
    </Button>
  );
}
