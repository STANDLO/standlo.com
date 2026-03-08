"use client";

import { useState } from "react";
import { DownloadCloud, UploadCloud, Terminal } from "lucide-react";

export default function DatabaseSyncPage() {
    const [localLog, setLocalLog] = useState<string>("");
    const [prodLog, setProdLog] = useState<string>("");
    const [isRunning, setIsRunning] = useState<"local" | "prod" | null>(null);

    const runSync = async (type: "local" | "prod") => {
        setIsRunning(type);
        const setLog = type === "local" ? setLocalLog : setProdLog;
        setLog(`🚀 Avvio sincronizzazione ${type === 'local' ? 'LOCALE' : 'PRODUZIONE'}...\n`);

        try {
            const res = await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command: type === "local" ? "sync:local" : "sync:production" })
            });

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            let done = false;
            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;
                if (value) {
                    setLog(prev => prev + decoder.decode(value, { stream: true }));
                }
            }
        } catch (e: unknown) {
            setLog(prev => prev + `\n❌ Errore: ${(e as Error).message}\n`);
        } finally {
            setIsRunning(null);
        }
    };

    return (
        <div className="flex-1 overflow-auto bg-[#f7f9fc] dark:bg-[#0e0e11] flex p-6 gap-6">
            {/* Colonne Sinistra - Sync Locale */}
            <div className="flex-1 flex flex-col gap-4 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-[#e3e8ee] dark:border-zinc-800 shadow-sm h-full max-h-full">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-[#1a1f36] dark:text-zinc-100"><DownloadCloud className="w-5 h-5 text-blue-500" /> SYNC LOCALE</h2>
                    <p className="text-sm text-[#8792a2] dark:text-zinc-400 mt-1">Scarica i dati live dal DB in Cloud e li posiziona in seed/ per l&apos;emulatore.</p>
                </div>
                <button
                    onClick={() => runSync("local")}
                    disabled={isRunning !== null}
                    className="bg-[#635BFF] text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 hover:bg-[#524ecc] transition text-sm"
                >
                    {isRunning === "local" ? "Sincronizzazione in corso..." : "AVVIA SYNC LOCALE"}
                </button>
                <div className="flex-1 bg-[#1a1f36] dark:bg-black text-green-400 p-4 rounded-lg overflow-auto font-mono text-xs mt-2 relative border border-[#0a2540] dark:border-zinc-800">
                    <div className="absolute top-2 right-2 text-gray-500 flex items-center gap-1"><Terminal className="w-3 h-3" /> Console</div>
                    <pre className="whitespace-pre-wrap mt-4">{localLog || "In attesa di esecuzione..."}</pre>
                </div>
            </div>

            {/* Colonna Destra - Sync Production */}
            <div className="flex-1 flex flex-col gap-4 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-[#e3e8ee] dark:border-zinc-800 shadow-sm h-full max-h-full">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-[#1a1f36] dark:text-zinc-100"><UploadCloud className="w-5 h-5 text-red-500" /> SYNC PRODUCTION</h2>
                    <p className="text-sm text-[#8792a2] dark:text-zinc-400 mt-1">Legge i dati PDM/Pipeline creati nell&apos;emulatore locale e li carica sul DB in Cloud.</p>
                </div>
                <button
                    onClick={() => runSync("prod")}
                    disabled={isRunning !== null}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50 hover:bg-red-600 transition text-sm"
                >
                    {isRunning === "prod" ? "Caricamento in corso..." : "AVVIA SYNC PRODUCTION"}
                </button>
                <div className="flex-1 bg-[#1a1f36] dark:bg-black text-green-400 p-4 rounded-lg overflow-auto font-mono text-xs mt-2 relative border border-[#0a2540] dark:border-zinc-800">
                    <div className="absolute top-2 right-2 text-gray-500 flex items-center gap-1"><Terminal className="w-3 h-3" /> Console</div>
                    <pre className="whitespace-pre-wrap mt-4">{prodLog || "In attesa di esecuzione..."}</pre>
                </div>
            </div>
        </div>
    );
}
