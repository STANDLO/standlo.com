import { db } from "@/lib/firebaseAdmin";
import { UserCheck } from "lucide-react";
import { UsersTable } from "./UsersTable";

export const dynamic = "force-dynamic";

export default async function UsersActivationPage() {
    // Fetch users directly via Firebase Admin on the server
    const snapshot = await db.collection("users")
        .where("active", "==", false)
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

    const pendingUsers = snapshot.docs.map(doc => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = doc.data() as any;
        return {
            id: doc.id,
            ...data,
            // Serialize timestamps for Client Component
            createdAt: data.createdAt?.toDate()?.toISOString() || null,
            updatedAt: data.updatedAt?.toDate()?.toISOString() || null,
        };
    });

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

            <UsersTable initialUsers={pendingUsers} />
        </div>
    );
}
