"use client";

import { useState } from "react";
import { FormList } from "@/components/forms/FormList";
// We import directly from the monorepo's src folder to reuse logic!
import { Button } from "@/components/ui/Button";

const ROLES = ["customer", "provider", "manager", "architect", "engineer", "designer", "electrician", "plumber"];
const ENTITIES = ["organization", "project", "catalog", "users"];

export default function SimulatorPage() {
    const [selectedRole, setSelectedRole] = useState("manager");
    const [selectedEntity, setSelectedEntity] = useState("organization");
    const [active, setActive] = useState(false);

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <header className="border-b border-border pb-4">
                <h1 className="text-3xl font-bold">Interactive QA Simulator</h1>
                <p className="text-muted-foreground mt-2">
                    Inject a specific Role ID into the SDUI engine to visualize what a user sees.
                </p>
                <div className="flex space-x-4 mt-6">
                    <div className="flex-1">
                        <label className="text-sm font-semibold mb-2 block">Impersonate Role</label>
                        <select
                            className="w-full bg-card border border-border rounded p-2"
                            value={selectedRole}
                            onChange={(e) => { setSelectedRole(e.target.value); setActive(false); }}
                        >
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-semibold mb-2 block">Entity View</label>
                        <select
                            className="w-full bg-card border border-border rounded p-2"
                            value={selectedEntity}
                            onChange={(e) => { setSelectedEntity(e.target.value); setActive(false); }}
                        >
                            {ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <Button onClick={() => setActive(true)}>Simulate SDUI</Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 bg-muted/50 rounded-xl border border-border overflow-hidden relative">
                {!active ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        Select a role and entity, then click Simulate.
                    </div>
                ) : (
                    <div className="p-6 h-full overflow-y-auto">
                        <h2 className="font-bold text-xl mb-6">Simulation View: /partner/{selectedRole}/{selectedEntity}</h2>
                        {/* We inject the localized props manually to mount the meta-form */}
                        <FormList
                            entityId={selectedEntity}
                            roleId={selectedRole}
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
