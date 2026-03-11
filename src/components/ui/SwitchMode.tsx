"use client"

import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/Button"
import { Box, LayoutDashboard, Settings, Home } from "lucide-react"

// Array dei mode di sistema duplicato dal backend (functions/src/index.ts) per evitare
// di importare `firebase-admin` nel bundle Next.js Client-Side.
export const systemUiModes = [
    { code: "home", nativeLabel: "Home Page", icon: "Home", color: "transparent" },
    { code: "tools", nativeLabel: "Tools Dashboard", icon: "LayoutDashboard", color: "blue" },
    { code: "canvas", nativeLabel: "3D Canvas", icon: "Box", color: "green" },
]

const setUiModeCookie = (newMode: string) => {
    document.cookie = `ui_mode=${newMode}; path=/; max-age=31536000`
    window.location.reload()
}

export function SwitchMode({ authVariant = "protected", hasToolsAccess = false }: { authVariant?: "public" | "protected", hasToolsAccess?: boolean }) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [dropdownPosition, setDropdownPosition] = React.useState<{ top: string; left?: string; right?: string }>({ top: "100%", right: "0" })
    const [mode, setMode] = React.useState("canvas") // Default

    const containerRef = React.useRef<HTMLDivElement>(null)
    const buttonRef = React.useRef<HTMLButtonElement>(null)

    React.useEffect(() => {
        // Hydrate from client cookie
        const match = document.cookie.match(new RegExp('(^| )ui_mode=([^;]+)'));
        if (match) {
            setMode(match[2]);
        }
    }, [])

    const currentModeObj = authVariant === "public"
        ? systemUiModes.find(m => m.code === "canvas")
        : systemUiModes.find(m => m.code === mode);

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleToggle = () => {
        if (authVariant === "public") return;

        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            const spaceRight = window.innerWidth - rect.right
            const spaceLeft = rect.left

            if (spaceRight < 200 && spaceLeft > 200) {
                setDropdownPosition({ top: "calc(100% + 8px)", right: "0" })
            } else {
                setDropdownPosition({ top: "calc(100% + 8px)", left: "0" })
            }
        }
        setIsOpen(!isOpen)
    }

    const switchMode = (newMode: string) => {
        setIsOpen(false)
        setUiModeCookie(newMode)
    }

    const getIcon = (iconName: string, className: string) => {
        switch (iconName) {
            case "LayoutDashboard": return <LayoutDashboard className={className} />;
            case "Box": return <Box className={className} />;
            case "Home": return <Home className={className} />;
            default: return <Settings className={className} />;
        }
    }

    return (
        <div className="ui-switch-mode" ref={containerRef}>
            <button
                type="button"
                ref={buttonRef as React.RefObject<HTMLButtonElement>}
                onClick={handleToggle}
                className="ui-canvas-tools-btn h-10 w-10 px-0 shrink-0"
                title="Switch UI Mode"
                data-active={isOpen}
            >
                {currentModeObj ? getIcon(currentModeObj.icon, "w-5 h-5") : <Settings className="w-5 h-5" />}
                <span className="sr-only">Switch UI Mode</span>
            </button>

            {isOpen && authVariant === "protected" && (
                <div
                    className="ui-switch-mode-dropdown"
                    style={dropdownPosition}
                >
                    <div className="ui-switch-mode-list">
                        {systemUiModes
                            .filter(m => m.code === "tools" ? hasToolsAccess : true)
                            .map((m) => {
                                const isActive = mode === m.code;
                                const itemVariant = isActive ? (`${m.color}Muted` as ButtonProps["variant"]) : "light";

                                return (
                                    <Button
                                        key={m.code}
                                        variant={itemVariant}
                                        onClick={() => switchMode(m.code)}
                                        className={isActive ? "ui-switch-mode-item-active" : "ui-switch-mode-item"}
                                    >
                                        {getIcon(m.icon, "h-[1.2rem] w-[1.2rem]")}
                                        <span className={isActive ? "" : "text-foreground"}>{m.nativeLabel}</span>
                                    </Button>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    )
}
