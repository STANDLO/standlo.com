"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Shield, Search, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type RoleItem = {
    value: string;
    label: string;
};

export default function RolesModelerPage() {
    const [roles, setRoles] = useState<RoleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newRoleId, setNewRoleId] = useState("");
    const [newRoleLabel, setNewRoleLabel] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/roles");
            const data = await res.json();
            setRoles(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleId || !newRoleLabel) return;

        // Auto-format ID logic: lowercase, no spaces
        const formattedId = newRoleId.toLowerCase().replace(/\s+/g, '');

        try {
            setIsSubmitting(true);
            const res = await fetch("/api/roles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: formattedId, label: newRoleLabel }),
            });

            const result = await res.json();
            if (res.ok) {
                alert(`Success: ${result.message}`);
                setIsAddModalOpen(false);
                setNewRoleId("");
                setNewRoleLabel("");
                fetchRoles(); // refresh list
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (err: unknown) {
            const error = err as Error;
            alert(`Error: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredRoles = roles.filter(r =>
        r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.value.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Shield className="h-8 w-8 text-indigo-500" />
                        System Role Modeler
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestisci la Single Source of Truth dei Ruoli di sistema centralizzati.
                    </p>
                </div>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" /> Nuovo Ruolo
                </Button>
            </div>

            <Card className="border-border bg-card">
                <CardHeader>
                    <CardTitle>Ruoli di Sistema ({roles.length})</CardTitle>
                    <CardDescription>
                        I ruoli qui definiti vengono mappati su tutto l&apos;applicativo, incluso Firebase App Check, RBAC Engine e schemi UI.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-2 mb-6">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cerca ruolo per ID o Label..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-md border overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">System ID</th>
                                    <th className="px-4 py-3 font-medium">Entity Label</th>
                                    <th className="px-4 py-3 font-medium w-[100px]">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground animate-pulse">
                                            Lettura AST dei Ruoli in corso...
                                        </td>
                                    </tr>
                                ) : filteredRoles.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                            Nessun ruolo trovato.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRoles.map((role) => (
                                        <tr key={role.value} className="bg-card hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-indigo-400">
                                                {role.value}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {role.label}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-0" disabled title="Funzione di eliminazione disabilitata per sicurezza logica.">
                                                    <Trash2 className="h-4 w-4 text-muted-foreground opacity-50" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Custom Modal for Add Role */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md overflow-hidden relative">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold leading-none tracking-tight">Aggiungi Nuovo Ruolo di Sistema</h2>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        L&apos;aggiunta di un nuovo ruolo inietterà dinamicamente le sue dichiarazioni tramite AST in <strong>primitives.ts</strong> e in tutte le tabelle RBAC di <strong>policyEngine.ts</strong> per prevenire compilation errors.
                                    </p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                                    <X className="h-4 w-4" />
                                    <span className="sr-only">Close</span>
                                </button>
                            </div>

                            <form onSubmit={handleCreateRole} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label htmlFor="roleId" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Programmatic ID (es. &apos;copywriter&apos;)</label>
                                    <Input
                                        id="roleId"
                                        placeholder="..."
                                        value={newRoleId}
                                        onChange={(e) => setNewRoleId(e.target.value)}
                                        className="font-mono"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="roleLabel" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Display Label (es. &apos;Copywriter&apos;)</label>
                                    <Input
                                        id="roleLabel"
                                        placeholder="..."
                                        value={newRoleLabel}
                                        onChange={(e) => setNewRoleLabel(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="flex justify-end pt-4 gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                                        Annulla
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                        {isSubmitting ? "AST Patching in corso..." : "Inietta Ruolo"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
