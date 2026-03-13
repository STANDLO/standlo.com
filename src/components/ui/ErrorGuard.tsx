"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
        <div className="ui-guard-wrapper">
            <Card color="default" layout="auto" className="ui-guard-card">
                <div className="ui-guard-icon-wrapper">
                    <ShieldAlert className="ui-guard-icon" strokeWidth={1.5} />
                </div>

                <div className="ui-guard-content">
                    <h2 className="ui-guard-title">Accesso Negato o Risorsa Non Trovata</h2>
                    <p className="ui-guard-message">
                        {displayMessage}
                    </p>
                    {refCode && (
                        <div className="ui-guard-ref-wrapper">
                            <p className="ui-guard-ref-label">Codice di Riferimento Supporto:</p>
                            <div
                                onClick={handleCopyCode}
                                className="ui-guard-ref-code"
                                title="Clicca per copiare"
                            >
                                <span>{refCode}</span>
                                {copied ? (
                                    <Check className="ui-guard-ref-code-check" />
                                ) : (
                                    <Copy className="ui-guard-ref-code-icon" />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="ui-guard-actions">
                    <Button variant="outline" onClick={() => onBack ? onBack() : router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <span>Torna Indietro</span>
                    </Button>
                    <Button variant="default" onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        <span>Ricarica Pagina</span>
                    </Button>
                    {/* Assume local support URL, adjust if needed */}
                    <Button variant="default" onClick={() => router.push('/support')}>
                        Contatta il Supporto
                    </Button>
                </div>
            </Card>

            {isDev && (
                <div className="ui-guard-dev-wrapper">
                    <div className="ui-guard-dev-header">
                        <p className="ui-guard-dev-title">Dev Mode - Sincere View</p>
                        <Button variant="outline" onClick={() => setShowSincere(!showSincere)}>
                            {showSincere ? "Nascondi" : "Mostra Errore Reale"}
                        </Button>
                    </div>
                    {showSincere && (
                        <div className="ui-guard-dev-content">
                            <h3 className="ui-guard-dev-content-title">{error?.name || 'Error'}</h3>
                            <div className="ui-guard-dev-content-body">
                                {JSON.stringify(error, Object.getOwnPropertyNames(error), 2)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
