"use client";

import { useEffect, useState } from "react";
import { UserCheck, Loader2 } from "lucide-react";
import { UsersTable } from "./UsersTable";
import { OrchestratorClient } from "../lib/orchestratorClient";

export default function UsersActivationPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pendingUsers, setPendingUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsers() {
            try {
                // Read from Orchestrator Gateway (Backend Admin SDK) to bypass Firestore Rules
                // but use our Client's environment context (Emulator vs Prod cookie)
                const rawUsers = await OrchestratorClient.list("user", {
                    filters: [{ field: "active", op: "==", value: false }],
                    orderBy: [{ field: "createdAt", direction: "desc" }],
                    limit: 100,
                    ignoreSystemFilters: true
                });

                // Orchestrator already handles id injection
                // Normalize Dates returned via REST (Admin SDK Firestore Timestamps -> ISO String)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const users = rawUsers.map((u: any) => ({
                    ...u,
                    createdAt: u.createdAt?._seconds ? new Date(u.createdAt._seconds * 1000).toISOString() : u.createdAt,
                    updatedAt: u.updatedAt?._seconds ? new Date(u.updatedAt._seconds * 1000).toISOString() : u.updatedAt,
                }));

                setPendingUsers(users);
            } catch (error) {
                console.error("Failed to fetch pending users", error);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <header className="border-b border-border pb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <UserCheck className="mr-3 w-8 h-8 text-[#635BFF]" />
                    Gestione Utenti
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    Attivazioni manuali in sospeso e panoramica degli iscritti non attivi. L&apos;attivazione sblocca l&apos;accesso al Portale per i ruoli partner, standlo e provider.
                </p>
            </header>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <UsersTable initialUsers={pendingUsers} />
            )}
        </div>
    );
}
