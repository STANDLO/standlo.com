"use client";

import { useState } from "react";
import { FormList } from "@/components/forms/FormList";
import { Button } from "@/components/ui/Button";

const ENTITIES = ["organization", "project", "catalog", "users"];

export default function CrudPage() {
    const [selectedEntity, setSelectedEntity] = useState("organization");
    const [active, setActive] = useState(false);

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <header className="border-b border-border pb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <span className="text-red-600 dark:text-red-400 mr-2">God Mode</span> Universal CRUD
                </h1>
                <p className="text-muted-foreground mt-2">
                    Inspect, edit, and delete any entity unconditionally overriding standard RBAC policies.
                </p>
                <div className="flex space-x-4 mt-6">
                    <div className="flex-1 max-w-sm">
                        <label className="text-sm font-semibold mb-2 block">Target Entity</label>
                        <select
                            className="w-full bg-card border border-border rounded p-2"
                            value={selectedEntity}
                            onChange={(e) => { setSelectedEntity(e.target.value); setActive(false); }}
                        >
                            {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button variant="primary" onClick={() => setActive(true)}>Initialize God Mode</Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900 overflow-hidden relative">
                {!active ? (
                    <div className="h-full flex items-center justify-center text-red-800/50 dark:text-red-400/50 font-bold">
                        AWAITING DIRECTIVE...
                    </div>
                ) : (
                    <div className="p-6 h-full overflow-y-auto">
                        <h2 className="font-bold text-xl mb-6 text-red-600">Active Target: /{selectedEntity}</h2>
                        {/* 
                            By supplying 'admin' as roleId, if our policy engine has an admin override, it will render all columns. 
                            Alternatively, a dedicated AdminFormList component could bypass Zod extraction entirely. 
                        */}
                        <FormList
                            entityId={selectedEntity}
                            roleId="admin"
                            columns={[
                                { key: "id", label: "ID" },
                                { key: "name", label: "Name" },
                                { key: "createdAt", label: "Data Creazione" }
                            ]}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
