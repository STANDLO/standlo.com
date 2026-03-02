import { ShieldAlert } from "lucide-react";
import { db } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export default async function SecurityAlertsPage() {
    // Fetch alerts directly via Firebase Admin on the server
    const snapshot = await db.collection("admin/security/alerts")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

    const alerts = snapshot.docs.map(doc => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = doc.data() as any;
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate()?.toISOString() || null,
        };
    });

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <header className="border-b border-border pb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <ShieldAlert className="mr-3 w-8 h-8 text-red-600 dark:text-red-400" />
                    Security Alerts & Logs
                </h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    Registro centralizzato di anomalie di sicurezza, errori applicativi e divergenze dallo schema dati Zod. I log qui sotto provengono dal namespace isolato <code>admin/security/alerts</code>.
                </p>
            </header>

            <div className="flex-1 bg-white dark:bg-[#1a1a1f] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative flex flex-col p-6 text-sm">
                <div className="ui-list-container">
                    <div className="ui-list-wrapper overflow-x-auto">
                        <table className="ui-table w-full text-left border-collapse">
                            <thead className="ui-table-thead border-b">
                                <tr className="ui-table-tr">
                                    <th className="ui-table-th p-3 font-semibold">Tipo</th>
                                    <th className="ui-table-th p-3 font-semibold">Azione</th>
                                    <th className="ui-table-th p-3 font-semibold">Entità Coinvolta</th>
                                    <th className="ui-table-th p-3 font-semibold">Messaggio di Errore</th>
                                    <th className="ui-table-th p-3 font-semibold">Utente (UID)</th>
                                    <th className="ui-table-th p-3 font-semibold">Ref. Code</th>
                                    <th className="ui-table-th p-3 font-semibold">Data</th>
                                </tr>
                            </thead>
                            <tbody className="ui-table-tbody">
                                {alerts.length > 0 ? (
                                    alerts.map((alert) => (
                                        <tr key={alert.id} className="ui-table-tr border-b hover:bg-gray-50 transition-colors">
                                            <td className="ui-table-td p-3">{alert.type || "-"}</td>
                                            <td className="ui-table-td p-3">{alert.action || "-"}</td>
                                            <td className="ui-table-td p-3">{alert.entityId || "-"}</td>
                                            <td className="ui-table-td p-3 max-w-xs truncate" title={alert.errorMessage}>{alert.errorMessage || "-"}</td>
                                            <td className="ui-table-td p-3">{alert.uid || "-"}</td>
                                            <td className="ui-table-td p-3 font-mono text-xs">{alert.errorReferenceCode || "-"}</td>
                                            <td className="ui-table-td p-3">
                                                {alert.createdAt ? new Date(alert.createdAt).toLocaleString('it-IT') : "-"}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="ui-table-empty p-6 text-center text-gray-500">
                                            Nessun alert trovato.
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
