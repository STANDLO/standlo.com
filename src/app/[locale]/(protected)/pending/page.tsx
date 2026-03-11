"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Clock, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { auth, appCheck } from "@/core/firebase";
import { getToken } from "firebase/app-check";

export default function PendingPage() {
    const t = useTranslations("Common");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);


        try {
            if (typeof auth.authStateReady === "function") {
                await auth.authStateReady();
            }

            if (!auth.currentUser) {
                console.warn("Nessun utente autenticato sul client.");
                setIsRefreshing(false);
                return;
            }

            // 1. Forza Firebase a recuperare un NUOVO idToken dai server di Google (conterrà i nuovi Claims)
            const idToken = await auth.currentUser.getIdToken(true);

            // 1.5. Ottieni il token AppCheck per evitare 'UNAUTHENTICATED' da Identity Platform
            let appCheckTokenStr = "";
            if (appCheck) {
                try {
                    const tokenResult = await getToken(appCheck, false);
                    appCheckTokenStr = tokenResult.token;
                } catch (err) {
                    console.warn("⚠️ Impossibile ottenere il token AppCheck dal client:", err);
                }
            }

            const headers = new Headers();
            headers.append('Authorization', `Bearer ${idToken}`);
            if (appCheckTokenStr) {
                headers.append('X-Firebase-AppCheck', appCheckTokenStr);
            }

            // 2. Passiamo il nuovo token immacolato al nostro endpoint di /api/auth/login che creerà la sessione
            const res = await fetch('/api/auth/login', {
                method: 'GET',
                headers: headers
            });

            if (res.ok) {

                setTimeout(() => {
                    window.location.reload();
                }, 400); // 400ms delay to let console catch up
            } else {
                console.error("❌ Errore durante il refresh del Server. Status:", res.status);
                setIsRefreshing(false);
            }
        } catch (error) {
            console.error("Errore critico durante l'aggiornamento dello stato:", error);
            setIsRefreshing(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-6">
            <div className="rounded-full bg-primary/10 p-6 ring-8 ring-primary/5 animate-pulse-slow">
                <Clock className="w-16 h-16 text-primary" strokeWidth={1.5} />
            </div>

            <div className="space-y-2 max-w-lg">
                <h2 className="text-2xl font-semibold tracking-tight">Account in Attesa di Attivazione</h2>
                <p className="text-muted-foreground">
                    Il tuo profilo è in fase di revisione da parte del team di un amministratore.
                    Una volta approvato, avrai accesso a tutte le funzionalità previste dal tuo ruolo.
                    Puoi ricaricare la pagina di tanto in tanto per controllare se sei stato attivato.
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                <Button variant="outline" onClick={() => window.location.href = '/api/auth/logout'} className="space-x-2" disabled={isRefreshing}>
                    <LogOut className="w-4 h-4" />
                    <span>{t("logout", { fallback: "Crea Nuovo Account / Esci" })}</span>
                </Button>
                <Button variant="default" onClick={handleRefresh} className="space-x-2" disabled={isRefreshing}>
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Aggiornamento...' : 'Aggiorna Stato'}</span>
                </Button>
            </div>
        </div>
    );
}
