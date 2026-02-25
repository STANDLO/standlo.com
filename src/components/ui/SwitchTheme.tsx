"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { getAuth, onAuthStateChanged, User } from "firebase/auth"
import { getFirestore, doc, updateDoc } from "firebase/firestore"
import { app } from "@/core/firebase"

import { Button } from "@/components/ui/Button"

// Inizializza Firestore (lato client)
const db = getFirestore(app)
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
        // e lo terrà persistente su altri device.
        if (user && user.uid) {
            try {
                const userRef = doc(db, "users", user.uid)
                await updateDoc(userRef, {
                    "claims.theme": newTheme
                })
                console.log(`Saved new theme preference '${newTheme}' for user ${user.uid}`)
            } catch (error) {
                console.error("Failed to sync theme to Firestore:", error)
            }
        }
    }

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="w-9 h-9 border-transparent rounded-full opacity-50">
                <span className="sr-only">Toggle theme placeholder</span>
            </Button>
        )
    }

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 border-transparent rounded-full"
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
            {theme === "light" ? (
                <Moon className="h-[1.2rem] w-[1.2rem] text-slate-600 transition-all dark:-rotate-90 dark:scale-0" />
            ) : (
                <Sun className="h-[1.2rem] w-[1.2rem] text-slate-400 transition-all dark:rotate-0 dark:scale-100" />
            )}
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}
