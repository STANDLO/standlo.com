"use client";

import * as React from "react";
import { FormList } from "@/components/forms/FormList";
import { Plus, ShieldAlert } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/core/firebase";

export default function UsersManagementPage() {
    const [isInviteOpen, setIsInviteOpen] = React.useState(false);
    const [inviteEmail, setInviteEmail] = React.useState("");
    const [inviteName, setInviteName] = React.useState("");
    const [inviteRole, setInviteRole] = React.useState("WORKER");
    const [isInviting, setIsInviting] = React.useState(false);

    // We assume the FormList component will inject the orgId from the token on the backend side if we don't pass one, 
    // or we can fetch it but our firestoreGateway handles `resolvedOrgId = orgId || request.auth.token?.orgId;`
    // So passing no orgId implies 'my current organization'

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        try {
            const runner = httpsCallable(functions, "orchestrator");
            await runner({
                actionId: "run_pipeline_test",
                payload: {
                    id: "organization-user-create",
                    context: {
                        email: inviteEmail,
                        name: inviteName,
                        type: inviteRole,
                    }
                }
            });
            setIsInviteOpen(false);
            setInviteEmail("");
            setInviteName("");

            // Reload window to reflect new user in FormList, or setup a refresh trigger
            window.location.reload();
        } catch (error) {
            console.error("Failed to invite user", error);
            alert("Errore durante l'invito. Riprova.");
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ShieldAlert className="w-8 h-8 text-primary" />
                        Staff & Permessi
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Gestisci i membri del tuo team e i loro permessi di accesso.
                    </p>
                </div>

                <Button onClick={() => setIsInviteOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Aggiungi Membro
                </Button>

                {isInviteOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden relative">
                            <div className="px-6 py-4 border-b">
                                <h3 className="text-lg font-semibold">Invita Nuovo Membro</h3>
                            </div>
                            <form onSubmit={handleInvite} className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        value={inviteEmail}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                                        placeholder="email@esempio.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">Nome (Opzionale)</label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={inviteName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteName(e.target.value)}
                                        placeholder="Mario Rossi"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Select
                                        id="role"
                                        label="Ruolo nel Team"
                                        value={inviteRole}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setInviteRole(e.target.value)}
                                        options={[
                                            { value: "ADMIN", label: "Amministratore" },
                                            { value: "DESIGNER", label: "Designer" },
                                            { value: "WORKER", label: "Operativo" },
                                            { value: "COLLAB", label: "Collaboratore Esterno" }
                                        ]}
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                                        Annulla
                                    </Button>
                                    <Button type="submit" disabled={isInviting}>
                                        {isInviting ? "Invio in corso..." : "Invia Invito"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <FormList
                    roleId="manager" // Using standard layout rules or any roleId since auth token provides org scope
                    entityId="organizationUser"
                    columns={[
                        {
                            key: "id",
                            label: "User",
                            render: (item) => (
                                <div className="font-medium">
                                    {item.id as string}
                                </div>
                            )
                        },
                        {
                            key: "type",
                            label: "Ruolo",
                            render: (item) => (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {item.type as string}
                                </span>
                            )
                        },
                        {
                            key: "isActive",
                            label: "Stato",
                            render: (item) => (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                    {item.isActive ? "Attivo" : "Sospeso"}
                                </span>
                            )
                        },
                        {
                            key: "createdAt",
                            label: "Aggiunto il",
                            render: (item) => (
                                <span className="text-gray-500">
                                    {item.createdAt ? new Date(item.createdAt as string).toLocaleDateString() : "-"}
                                </span>
                            )
                        }
                    ]}
                />
            </div>
        </div>
    );
}
