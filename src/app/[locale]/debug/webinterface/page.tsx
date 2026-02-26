"use client";

import React, { useEffect, useState } from "react";
import { auth, functions } from "@/core/firebase";
import { httpsCallable } from "firebase/functions";

const roles = [
    "customer", "provider", "manager", "architect", "engineer", "designer",
    "electrician", "plumber", "carpenter", "cabinetmaker", "dryliner", "ironworker",
    "windowfitter", "glazier", "riggers", "standbuilder", "plasterer", "painter",
    "tiler", "driver", "forkliftdriver", "promoter", "pending"
];

export default function WebInterfaceDebugPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [debugData, setDebugData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>("manager");

    const fetchDebugData = async () => {
        setLoading(true);
        setDebugData(null);
        try {
            await auth.authStateReady();

            const payload = {
                roleId: selectedRole,
                correlationId: `debug-nav-${Date.now()}`
            };

            const webInterface = httpsCallable(functions, "webInterface");
            const res = await webInterface(payload);

            setDebugData(res.data);
        } catch (error: unknown) {
            const err = error as Error & { details?: unknown };
            setDebugData({
                error: err.message || "Unknown Error",
                details: err.details
            });
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch on mount and when role changes
    useEffect(() => {
        fetchDebugData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRole]);

    return (
        <div className="p-8 bg-slate-950 text-emerald-400 font-mono text-sm min-h-screen overflow-auto">
            <div className="max-w-5xl mx-auto mb-8">
                <h1 className="text-2xl text-white mb-2">🔍 WebInterface UI Configuration</h1>
                <p className="text-slate-400 mb-6">Testa la configurazione SDUI e le voci di navigazione restituite dinamicamente dalla Cloud Function, divise per ruolo.</p>

                <div className="flex items-center gap-4 mb-8">
                    <label className="text-slate-300">Simula Ruolo:</label>
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="bg-slate-900 border border-slate-700 text-white rounded px-3 py-2 outline-none focus:border-emerald-500"
                    >
                        {roles.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                    <button
                        onClick={fetchDebugData}
                        disabled={loading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
                    >
                        {loading ? "Ricaricamento..." : "Ricarica Payload"}
                    </button>
                </div>
            </div>

            {loading && !debugData && (
                <div className="text-center py-10 opacity-50">
                    Connessione a WebInterface Gateway...
                </div>
            )}

            {debugData && (
                <pre className="max-w-5xl mx-auto whitespace-pre-wrap break-words border border-emerald-900/30 p-6 rounded-md bg-black/50 overflow-x-auto">
                    {JSON.stringify(debugData, null, 2)}
                </pre>
            )}
        </div>
    );
}
