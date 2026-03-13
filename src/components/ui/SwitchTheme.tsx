"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/providers/ThemeProvider"
import { getAuth, onAuthStateChanged, User } from "firebase/auth"
import { app } from "@/core/firebase"
import { updateUserTheme } from "@/app/actions/theme"

const auth = getAuth(app)

export function SwitchTheme() {
    const { theme, setTheme } = useTheme()
    const [user, setUser] = React.useState<User | null>(null)
    const [mounted, setMounted] = React.useState(false)

    // Evita l'hydration mismatch e ascolta l'Auth state Firebase standard
    React.useEffect(() => {
        setMounted(true)
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
        })
        return () => unsubscribe()
    }, [])

    const toggleTheme = async () => {
        const newTheme = theme === "light" ? "dark" : "light"

        // 1. Aggiorna lo stato locale / localStorage (gestito in automatico da next-themes)
        setTheme(newTheme)

        // 2. Se l'utente è loggato, aggiorna le preferenze in remoto.
        // Questo causerà la riscrittura del custom claim dal cloud al prossimo login
        // e lo terrà persistente su altri device. Server Action is used to comply with Firestore rules.
        if (user && user.uid) {
            try {
                await updateUserTheme(newTheme);
            } catch (error) {
                console.error("Failed to sync theme to Firestore:", error)
            }
        }
    }

    if (!mounted) {
        return (
            <button type="button" className="ui-design-tools-btn h-10 w-10 px-0 shrink-0 border-transparent opacity-50">
                <span className="sr-only">Toggle theme placeholder</span>
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className="ui-design-tools-btn h-10 w-10 px-0 shrink-0"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
            {theme === "light" ? (
                <Moon className="ui-design-tools-icon transition-all dark:-rotate-90 dark:scale-0" />
            ) : (
                <Sun className="ui-design-tools-icon transition-all dark:rotate-0 dark:scale-100" />
            )}
            <span className="sr-only">Toggle theme</span>
        </button>
    )
}
