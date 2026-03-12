"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Copy, Check, RefreshCw, ArrowLeft, ShieldAlert } from "lucide-react";
import { useState } from "react";

interface ErrorGuardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: Error | any;
    onBack?: () => void;
}

export function ErrorGuard({ error, onBack }: ErrorGuardProps) {
    const t = useTranslations("Common");
    const router = useRouter();
    const [showSincere, setShowSincere] = useState(false);

    // Extract reference code if present in the message (format: "... Riferimento errore: UUID")
    const message = error?.message || String(error);
    const refMatch = message.match(/Riferimento errore:\s*([a-f\d-]+)/i);
    const refCode = refMatch ? refMatch[1] : null;

    const displayMessage = refMatch
        ? message.substring(0, refMatch.index).trim()
        : t('genericError', { fallback: "C'è stato un problema nel processare la tua richiesta." });

    const [copied, setCopied] = useState(false);

    const handleCopyCode = () => {
        if (refCode) {
            navigator.clipboard.writeText(refCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const isDev = process.env.NODE_ENV === "development";

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-6">
            <div className="rounded-full bg-destructive/10 p-6 ring-8 ring-destructive/5 animate-pulse-slow">
                <ShieldAlert className="w-16 h-16 text-destructive" strokeWidth={1.5} />
            </div>

            <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-semibold tracking-tight">Accesso Negato o Risorsa Non Trovata</h2>
                <p className="text-muted-foreground">
                    {displayMessage}
                </p>
                {refCode && (
                    <div className="mt-4 flex flex-col items-center space-y-2">
                        <p className="text-sm font-medium">Codice di Riferimento Supporto:</p>
                        <div
                            onClick={handleCopyCode}
                            className="flex items-center space-x-2 bg-muted px-4 py-2 rounded-md font-mono text-xs cursor-pointer hover:bg-muted/80 transition-colors group"
                            title="Clicca per copiare"
                        >
                            <span>{refCode}</span>
                            {copied ? (
                                <Check className="w-3 h-3 text-green-500" />
                            ) : (
                                <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground" />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                <Button variant="outline" onClick={() => onBack ? onBack() : router.back()} className="space-x-2">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Torna Indietro</span>
                </Button>
                <Button variant="default" onClick={() => window.location.reload()} className="space-x-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Ricarica Pagina</span>
                </Button>
                {/* Assume local support URL, adjust if needed */}
                <Button variant="default" onClick={() => router.push('/support')}>
                    Contatta il Supporto
                </Button>
            </div>

            {isDev && (
                <div className="mt-12 text-left w-full max-w-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dev Mode - Sincere View</p>
                        <Button variant="outline" onClick={() => setShowSincere(!showSincere)}>
                            {showSincere ? "Nascondi" : "Mostra Errore Reale"}
                        </Button>
                    </div>
                    {showSincere && (
                        <div className="overflow-auto max-h-64 bg-red-50 text-red-900 border border-red-200 rounded-md p-4">
                            <h3 className="font-mono text-sm font-bold mb-2">{error?.name || 'Error'}</h3>
                            <div className="font-mono text-xs whitespace-pre-wrap">
                                {JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
