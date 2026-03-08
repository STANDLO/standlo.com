"use client"

import * as React from "react"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/Button"
import { Globe } from "lucide-react"

// Array dei locali di sistema duplicato dal backend (functions/src/index.ts) per evitare 
// di importare `firebase-admin` nel bundle Next.js Client-Side.
const systemLocales = [
    { code: "it", nativeLabel: "Italia", flag: "🇮🇹" },
    { code: "es", nativeLabel: "España", flag: "🇪🇸" },
    { code: "en", nativeLabel: "United Kingdom", flag: "🇬🇧" },
    { code: "us", nativeLabel: "United States of America", flag: "🇺🇸" },
    { code: "de", nativeLabel: "Deutschland", flag: "🇩🇪" },
    { code: "fr", nativeLabel: "France", flag: "🇫🇷" }
]

export function SwitchLocale() {
    const locale = useLocale()

    const [isOpen, setIsOpen] = React.useState(false)
    const [dropdownPosition, setDropdownPosition] = React.useState<{ top: string; left?: string; right?: string }>({ top: "100%", right: "0" })

    const containerRef = React.useRef<HTMLDivElement>(null)
    const buttonRef = React.useRef<HTMLButtonElement>(null)

    // Current active locale
    const currentLocaleObj = systemLocales.find(loc => loc.code === locale)

    // Handle clicks outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    // Handle dynamic dropdown positioning to not overflow screen edges
    const handleToggle = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            const spaceRight = window.innerWidth - rect.right
            const spaceLeft = rect.left

            // If we are too close to the right edge (e.g., < 200px), align dropdown to the right. 
            // Otherwise align to the left of the button.
            if (spaceRight < 200 && spaceLeft > 200) {
                setDropdownPosition({ top: "calc(100% + 8px)", right: "0" })
            } else {
                setDropdownPosition({ top: "calc(100% + 8px)", left: "0" })
            }
        }
        setIsOpen(!isOpen)
    }

    const switchLanguage = (newLocale: string) => {
        setIsOpen(false)
        const baseUrl = process.env.NEXT_PUBLIC_URL || ""
        const currentPath = window.location.pathname

        // Sostituisce il locale corrente nell'URL con il locale target. 
        // E.g. /it/auth/create -> /es/auth/create
        const newPath = currentPath.replace(`/${locale}`, `/${newLocale}`)
        window.location.assign(`${baseUrl}${newPath}${window.location.search}`)
    }

    return (
        <div className="relative inline-block text-left" ref={containerRef}>
            <Button
                variant="outline"
                size="icon"
                ref={buttonRef}
                onClick={handleToggle}
                className="layout-header-action-btn"
                title="Change language"
            >
                {currentLocaleObj ? (
                    <span className="text-lg leading-none">{currentLocaleObj.flag}</span>
                ) : (
                    <Globe className="h-[1.2rem] w-[1.2rem]" />
                )}
                <span className="sr-only">Switch language</span>
            </Button>

            {isOpen && (
                <div
                    className="absolute z-50 mt-2 w-56 rounded-md border border-border bg-popover text-popover-foreground shadow-lg shadow-black/5 outline-none"
                    style={dropdownPosition}
                >
                    <div className="py-1">
                        {systemLocales.map((loc) => (
                            <button
                                key={loc.code}
                                onClick={() => switchLanguage(loc.code)}
                                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-muted transition-colors ${locale === loc.code ? "bg-primary/10 text-primary font-medium" : ""
                                    }`}
                            >
                                <span className="text-xl leading-none">{loc.flag}</span>
                                <span>{loc.nativeLabel}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
