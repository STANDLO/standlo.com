"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/core/firebase";
import { useRouter } from "next/navigation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function UsersTable({ initialUsers }: { initialUsers: any[] }) {
    const [activating, setActivating] = useState<string | null>(null);
    const router = useRouter();

    const handleActivate = async (userId: string) => {
        if (!confirm("Sei sicuro di voler attivare questo utente?")) return;
        setActivating(userId);
        try {
            const orchestrator = httpsCallable(functions, "orchestrator");
            await orchestrator({
                actionId: "activate_user",
                payload: { userId }
            });
            alert("Utente attivato con successo.");
            router.refresh();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            alert(`Errore Server: ${error.message || String(error)}`);
        } finally {
            setActivating(null);
        }
    };

    return (
        <div className="flex-1 bg-white dark:bg-[#1a1a1f] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative flex flex-col">
            <div className="p-6 h-full overflow-y-auto">
                <h2 className="font-bold text-lg mb-4 text-[#1a1f36] dark:text-zinc-100">Richieste in Sospeso</h2>

                <div className="ui-list-container">
                    <div className="ui-list-wrapper overflow-x-auto">
                        <table className="ui-table w-full text-left border-collapse">
                            <thead className="ui-table-thead border-b">
                                <tr className="ui-table-tr">
                                    <th className="ui-table-th p-3 font-semibold">Email</th>
                                    <th className="ui-table-th p-3 font-semibold">Ruolo Richiesto</th>
                                    <th className="ui-table-th p-3 font-semibold">Nome</th>
                                    <th className="ui-table-th p-3 font-semibold">Cognome</th>
                                    <th className="ui-table-th p-3 font-semibold">Registrazione</th>
                                    <th className="ui-table-th p-3 font-semibold">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="ui-table-tbody">
                                {initialUsers.length > 0 ? (
                                    initialUsers.map((user) => (
                                        <tr key={user.id} className="ui-table-tr border-b hover:bg-gray-50 transition-colors">
                                            <td className="ui-table-td p-3">{user.email || "-"}</td>
                                            <td className="ui-table-td p-3">{user.claims?.role || user.roleId || "-"}</td>
                                            <td className="ui-table-td p-3">{user.firstName || "-"}</td>
                                            <td className="ui-table-td p-3">{user.lastName || "-"}</td>
                                            <td className="ui-table-td p-3">
                                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : "-"}
                                            </td>
                                            <td className="ui-table-td p-3">
                                                <Button
                                                    variant="primary"
                                                    onClick={() => handleActivate(user.id)}
                                                    disabled={activating === user.id}
                                                >
                                                    {activating === user.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                    Autorizza
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="ui-table-empty p-6 text-center text-gray-500">
                                            Nessuna richiesta in sospeso.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
