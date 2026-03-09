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
    const [env, setEnv] = useState<"production" | "emulator">("production");

    // Initialize environment from cookie
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (document.cookie.includes("firebase_env=emulator")) {
                setEnv("emulator");
            } else {
                setEnv("production");
            }
        }, 0);
        return () => clearTimeout(timeoutId);
    }, []);

    const handleEnvChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newEnv = e.target.value as "production" | "emulator";

        // AGGRESSIVE CLEARING of potential stray duplicate cookies from previous logic
        document.cookie = 'firebase_env=; Max-Age=0;';
        document.cookie = 'firebase_env=; Max-Age=0; path=/;';
        document.cookie = `firebase_env=; Max-Age=0; path=/; domain=${window.location.hostname};`;

        // Save new choice cleanly
        document.cookie = `firebase_env=${newEnv}; path=/; max-age=31536000`; // 1 year expiry

        try {
            // FORCE sign out when switching environments so that cached emulator tokens
            // in IndexedDB aren't mistakenly used in Production, and vice-versa.
            await signOut(auth);

            // Also explicitly delete the server-side next-firebase-auth-edge cookies
            document.cookie = 'AuthToken=; Max-Age=0; path=/;';
            document.cookie = 'AuthToken.sig=; Max-Age=0; path=/;';
        } catch (error) {
            console.error("Error signing out during Env switch:", error);
        }

        // Force an immediate reload so `src/core/firebase.ts` runs again 
        // with the new cookie before the user logs in.
        window.location.reload();
    };

    // Firebase Auth State Listener
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
        } catch {
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
                            {/* Environment Selector before Login */}
                            <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-border">
                                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest min-w-[60px]">
                                    ENV
                                </label>
                                <select
                                    value={env}
                                    onChange={handleEnvChange}
                                    className="flex-1 bg-white dark:bg-zinc-950 border border-border rounded text-sm px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 cursor-pointer"
                                >
                                    <option value="production">Production Cloud</option>
                                    <option value="emulator">Local Emulator (127.0.0.1)</option>
                                </select>
                            </div>

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
