"use client";

import * as React from "react";
import { FormList } from "@/components/forms/FormList";
import { Plus, ShieldAlert, Trash2 } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { auth } from "@/core/firebase";
import { callGateway } from "@/lib/api";

export default function OrganizationUsersCreate({ currentOrgId }: { currentOrgId: string }) {
    const [isInviteOpen, setIsInviteOpen] = React.useState(false);
    const [inviteEmail, setInviteEmail] = React.useState("");
    const [inviteName, setInviteName] = React.useState("");
    const [invitePassword, setInvitePassword] = React.useState("");
    const [inviteRole, setInviteRole] = React.useState("WORKER");
    const [isInviting, setIsInviting] = React.useState(false);

    // We assume the FormList component will inject the orgId from the token on the backend side if we don't pass one, 
    // or we can fetch it but our firestoreGateway handles `resolvedOrgId = orgId || request.auth.token?.orgId;`
    // So passing no orgId implies 'my current organization'

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        try {
            if (!currentOrgId) {
                throw new Error("Missing orgId in properties.");
            }

            // Sync Firebase Client Auth
            await auth.authStateReady();
            if (!auth.currentUser) {
                throw new Error("UNAUTHENTICATED: Impossibile sincronizzare la sessione client. Ricarica la pagina.");
            }

            await callGateway("orchestrator", {
                actionId: "create_entity",
                entityId: "organizationUser",
                payload: {
                    type: inviteRole,
                    email: inviteEmail,
                    name: inviteName,
                    password: invitePassword || undefined,
                    orgId: currentOrgId,
                }
            });
            setIsInviteOpen(false);
            setInviteEmail("");
            setInviteName("");
            setInvitePassword("");

            // Reload window to reflect new user in FormList, or setup a refresh trigger
            window.location.reload();
        } catch (error) {
            console.error("Failed to invite user", error);
            alert("Errore durante l'invito. Riprova.");
        } finally {
            setIsInviting(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm("Sei sicuro di voler rimuovere questo utente dall'organizzazione?")) return;

        try {
            await auth.authStateReady();
            if (!auth.currentUser) {
                throw new Error("UNAUTHENTICATED: Impossibile sincronizzare la sessione client. Ricarica la pagina.");
            }

            await callGateway("orchestrator", {
                actionId: "delete_entity",
                entityId: "organizationUser",
                payload: {
                    id: userId,
                    orgId: currentOrgId
                }
            });

            window.location.reload();
        } catch (error) {
            console.error("Failed to delete user", error);
            const errorMessage = error instanceof Error ? error.message : "Riprova.";
            alert("Errore durante l'eliminazione: " + errorMessage);
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
                                    <label htmlFor="email" className="text-sm font-medium">
                                        Email <span className="text-red-500">*</span>
                                    </label>
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
                                    <label htmlFor="name" className="text-sm font-medium">
                                        Nome <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id="name"
                                        type="text"
                                        required
                                        value={inviteName}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteName(e.target.value)}
                                        placeholder="Mario Rossi"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-medium">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        value={invitePassword}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvitePassword(e.target.value)}
                                        placeholder="Generata se vuoto"
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
                                        {isInviting ? "Invio in corso..." : "Crea Utente"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <FormList
                    orgId={currentOrgId}
                    roleId="manager" // Using standard layout rules or any roleId since auth token provides org scope
                    entityId="organizationUser"
                    columns={[
                        {
                            key: "displayName",
                            label: "Utente",
                            render: (item) => (
                                <div>
                                    <div className="font-medium">
                                        {(item.displayName as string) || (item.email as string) || (item.id as string)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {item.email as string}
                                    </div>
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
                            key: "active",
                            label: "Stato",
                            render: (item) => (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.active !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                    {item.active !== false ? "Attivo" : "Sospeso"}
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
                        },
                        {
                            key: "actions",
                            label: "",
                            render: (item) => (
                                <div className="flex justify-end pr-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-red-500 hover:bg-red-50 hover:text-red-600 border-transparent shadow-none"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteUser(item.id as string);
                                        }}
                                        title="Elimina Utente"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )
                        }
                    ]}
                />
            </div>
        </div>
    );
}
