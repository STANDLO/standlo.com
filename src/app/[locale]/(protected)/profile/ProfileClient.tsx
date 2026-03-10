"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { generateApiKey } from "./actions";

interface ProfileClientProps {
    initialHint: string | null;
    initialCreatedAt: number | null;
}

export default function ProfileClient({ initialHint, initialCreatedAt }: ProfileClientProps) {
    const [hint, setHint] = useState<string | null>(initialHint);
    const [createdAt, setCreatedAt] = useState<number | null>(initialCreatedAt);
    const [clearKey, setClearKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (hint && !window.confirm("Sei sicuro di voler rigenerare la chiave? La vecchia chiave smetterà di funzionare immediatamente e le integrazioni si romperanno.")) {
            return;
        }

        setIsLoading(true);
        setClearKey(null);
        try {
            const res = await generateApiKey();
            if (res.success && res.clearKey && res.hint) {
                setClearKey(res.clearKey);
                setHint(res.hint);
                setCreatedAt(Date.now());
            } else {
                alert("Errore durante la generazione: " + res.error);
            }
        } catch (e) {
            console.error(e);
            alert("Errore di rete durante la generazione della chiave.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 max-w-2xl">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">API Key (Developer Access)</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-sm">
                Utilizza questa API Key per autenticare le richieste server-to-server.
                Per motivi di sicurezza, la chiave completa verrà mostrata **solo una volta** durante la generazione.
                Se la perdi, dovrai rigenerarne una nuova.
            </p>

            {clearKey && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg p-4 mb-6">
                    <p className="text-green-800 dark:text-green-300 text-sm font-medium mb-2">
                        API Key generata con successo! Copiala ora, non sarà più visibile.
                    </p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white dark:bg-black px-3 py-2 rounded border border-green-200 dark:border-green-800 text-green-900 dark:text-green-400 font-mono text-sm break-all">
                            {clearKey}
                        </code>
                        <Button variant="outline" onClick={() => navigator.clipboard.writeText(clearKey)}>
                            Copia
                        </Button>
                    </div>
                </div>
            )}

            {!clearKey && hint && (
                <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-lg p-4 mb-6 flex justify-between items-center">
                    <div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Chiave attualmente in uso</p>
                        <p className="font-mono text-zinc-900 dark:text-zinc-100 mt-1">{hint}</p>
                        {createdAt && <p className="text-xs text-zinc-500 mt-1">Generata il: {new Date(createdAt).toLocaleString()}</p>}
                    </div>
                    <div className="text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Attiva
                    </div>
                </div>
            )}

            <div className="flex gap-4">
                <Button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    variant={hint ? "outline" : "default"}
                >
                    {isLoading ? "Generazione..." : hint ? "Rigenera API Key" : "Genera API Key"}
                </Button>
            </div>
        </div>
    );
}
