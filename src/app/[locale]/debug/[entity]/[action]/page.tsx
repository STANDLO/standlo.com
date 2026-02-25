"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { auth, functions } from "@/core/firebase";
import { httpsCallable } from "firebase/functions";

export default function DebugWebInterfacePage() {
    const params = useParams();
    const entity = params.entity as string;
    const action = params.action as string;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [debugData, setDebugData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDebugData = async () => {
            try {
                // Ensure the Firebase auth SDK has verified the user state
                await auth.authStateReady();

                // Fictional Base Payload for debugging purposes
                const payload = {
                    actionId: action,
                    entityId: entity,
                    roleId: "manager", // Defaulting to manager to see the max permission set
                    correlationId: `debug-${Date.now()}`,
                    idempotencyKey: `idem-${Date.now()}`
                };

                const webInterface = httpsCallable(functions, "webInterface");
                const res = await webInterface(payload);

                setDebugData({
                    payload: [payload],
                    response: [res.data]
                });

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                setDebugData({
                    payload: [{
                        actionId: action,
                        entityId: entity,
                        roleId: "manager"
                    }],
                    response: [{
                        error: error.message || "Unknown Error",
                        details: error.details
                    }]
                });
            } finally {
                setLoading(false);
            }
        };

        fetchDebugData();
    }, [action, entity]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950 text-emerald-500 font-mono text-sm">
                Caricamento dati di debug SDUI...
            </div>
        );
    }

    return (
        <div className="p-8 bg-slate-950 text-emerald-400 font-mono text-sm min-h-screen overflow-auto">
            <h1 className="text-xl text-white mb-6">🔍 WebInterface Gateway Debugger</h1>
            <pre className="whitespace-pre-wrap break-words border border-emerald-900/30 p-4 rounded-md bg-black/50">
                {JSON.stringify(debugData, null, 2)}
            </pre>
        </div>
    );
}
