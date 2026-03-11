"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type Theme = "light" | "dark";

const ThemeContext = React.createContext<{
    theme: Theme;
    setTheme: (theme: Theme) => void;
}>({
    theme: "light",
    setTheme: () => { },
});

export function ThemeProvider({
    children,
    initialTheme,
}: {
    children: React.ReactNode;
    initialTheme: Theme;
}) {
    const [theme, setThemeState] = React.useState<Theme>(initialTheme);
    const router = useRouter();

    const setTheme = React.useCallback(
        (newTheme: Theme) => {
            setThemeState(newTheme);
            document.documentElement.classList.remove("light", "dark");
            document.documentElement.classList.add(newTheme);
            document.cookie = `ui_theme=${newTheme}; path=/; max-age=31536000`;
            router.refresh(); // Optional, but helps sync server components over time
        },
        [router]
    );

    // Hydrate from client cookie as a fallback
    React.useEffect(() => {
        const match = document.cookie.match(new RegExp('(^| )ui_theme=([^;]+)'));
        if (match && (match[2] === "light" || match[2] === "dark") && match[2] !== theme) {
            setThemeState(match[2] as Theme);
        }
    }, [theme])

    // Sync class on mount and on state changes
    React.useEffect(() => {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => React.useContext(ThemeContext);
