"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, LogOut } from "lucide-react";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@standlo/src/core/firebase";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
    const [isLogged, setIsLogged] = useState<boolean | null>(null);
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && user.email === "kalex@standlo.com") {
                if (isMounted) setIsLogged(true);
            } else {
                if (user) {
                    // Sign out unauthorized users immediately
                    signOut(auth);
                }
                if (isMounted) setIsLogged(false);
            }
        });
        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (email !== "kalex@standlo.com") {
            setError("Accesso negato. Solo l'utente KalexAI è autorizzato.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // onAuthStateChanged will handle the state update
        } catch (err: any) {
            setError("Credenziali non valide.");
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    // Wait for client to determine auth state
    if (isLogged === null) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background">
                <span className="animate-pulse flex items-center gap-2 text-muted-foreground font-medium">
                    <ShieldAlert className="w-5 h-5" /> Initializing Control Panel...
                </span>
            </div>
        );
    }

    // If not logged in, show the login guard
    if (!isLogged) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-[#f7f9fc] dark:bg-[#0e0e11]">
                <div className="max-w-md w-full p-8 bg-card border border-border/50 shadow-2xl rounded-2xl relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>

                    <div className="flex justify-center mb-6 mt-2">
                        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 dark:bg-red-950/30 flex items-center justify-center shadow-inner">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-center mb-2 tracking-tight">System Restricted</h1>
                    <p className="text-muted-foreground text-center mb-8 text-sm">
                        Access is strictly restricted to KalexAI Organization Administrators.
                    </p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-3">
                            <input
                                type="email"
                                className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                placeholder="Admin Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                                required
                            />
                            <input
                                type="password"
                                className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                                placeholder="Master Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white rounded-lg font-semibold transition-all shadow hover:shadow-md cursor-pointer"
                        >
                            Authorize
                        </button>
                    </form>

                </div>
            </div>
        );
    }

    // If logged in, render the actual admin studio children with a hidden logout overlay capability if needed
    // The Sidebar handles the actual layout, but we could inject a logout button somewhere globally here if desired.
    return (
        <>
            <button
                onClick={handleLogout}
                title="Force Logout from Admin"
                className="fixed z-50 bottom-4 right-4 p-3 bg-red-500 text-white rounded-full opacity-20 hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
            >
                <LogOut className="w-5 h-5" />
            </button>
            {children}
        </>
    );
}
