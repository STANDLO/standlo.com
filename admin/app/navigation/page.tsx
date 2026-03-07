"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, LayoutTemplate, Map } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NavItem {
    labelKey: string;
    path: string;
    icon: string;
    matchPattern?: string;
}

export default function NavigationManager() {
    const [manifests, setManifests] = useState<Record<string, NavItem[]>>({});
    const [activeRole, setActiveRole] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/admin/api/navigation/manifest")
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setManifests(data.manifests);
                    const roles = Object.keys(data.manifests);
                    if (roles.length > 0) setActiveRole(roles[0]);
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const handleItemChange = (index: number, field: keyof NavItem, value: string) => {
        const newManifests = { ...manifests };
        newManifests[activeRole][index] = {
            ...newManifests[activeRole][index],
            [field]: value
        };
        // Clean up empty match pattern
        if (field === 'matchPattern' && value.trim() === '') {
            delete newManifests[activeRole][index].matchPattern;
        }
        setManifests(newManifests);
    };

    const handleAddItem = () => {
        const newManifests = { ...manifests };
        newManifests[activeRole] = [
            ...newManifests[activeRole],
            { labelKey: "new_menu", path: `/partner/\${roleId}/new`, icon: "Circle" }
        ];
        setManifests(newManifests);
    };

    const handleRemoveItem = (index: number) => {
        const newManifests = { ...manifests };
        newManifests[activeRole] = newManifests[activeRole].filter((_, i) => i !== index);
        setManifests(newManifests);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/admin/api/navigation/manifest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    role: activeRole,
                    items: manifests[activeRole]
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Navigation saved successfully for role: " + activeRole);
            } else {
                alert("Error: " + data.error);
            }
        } catch (e) {
            alert("Error saving: " + String(e));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Manifest...</div>;
    }

    const roles = Object.keys(manifests);

    if (roles.length === 0) {
        return <div className="p-8 text-center text-muted-foreground">No roles found in policyEngine.ts</div>;
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Map className="h-8 w-8 text-indigo-500" />
                        Navigation Manifest Modeler
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Visually edit the Zero-Boilerplate SDUI Navigation Sidebar Menus.
                        Supports direct AST mutations inside `functions/src/rbac/policyEngine.ts`.
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving} variant="primary">
                    <Save className={`mr-2 h-4 w-4 ${saving ? "animate-spin" : ""}`} />
                    {saving ? "Saving AST..." : "Save Role"}
                </Button>
            </header>

            <div className="flex bg-card border rounded-lg overflow-hidden shadow-sm h-[600px]">
                {/* Sidebar Roles */}
                <div className="w-64 border-r bg-muted/20">
                    <div className="p-4 border-b font-medium text-sm flex items-center text-muted-foreground">
                        <LayoutTemplate className="w-4 h-4 mr-2" />
                        Access Roles
                    </div>
                    <ul className="flex flex-col py-2">
                        {roles.map(role => (
                            <li key={role}>
                                <button
                                    onClick={() => setActiveRole(role)}
                                    className={`w-full text-left px-6 py-3 text-sm transition-colors ${activeRole === role ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
                                >
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Editor Area */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold capitalize">{activeRole} Menu</h2>
                            <p className="text-sm text-muted-foreground">Define the items shown in the sidebar for this role.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleAddItem}>
                            <Plus className="mr-2 h-4 w-4" /> Add Item
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {manifests[activeRole]?.length === 0 ? (
                            <div className="text-center p-8 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30 text-muted-foreground">
                                No navigation items for this role.
                            </div>
                        ) : (
                            manifests[activeRole]?.map((item, index) => (
                                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg bg-background">
                                    <div className="grid grid-cols-2 gap-4 flex-1">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">Label Key (i18n)</label>
                                            <input
                                                className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
                                                value={item.labelKey}
                                                onChange={(e) => handleItemChange(index, "labelKey", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">Lucide Icon</label>
                                            <input
                                                className="w-full border rounded-md px-3 py-2 text-sm bg-transparent"
                                                value={item.icon}
                                                onChange={(e) => handleItemChange(index, "icon", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">Destination Path</label>
                                            <input
                                                className="w-full border rounded-md px-3 py-2 text-sm bg-transparent font-mono text-blue-600"
                                                value={item.path}
                                                onChange={(e) => handleItemChange(index, "path", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-muted-foreground">Match Pattern (Optional)</label>
                                            <input
                                                className="w-full border rounded-md px-3 py-2 text-sm bg-transparent font-mono text-purple-600"
                                                value={item.matchPattern || ""}
                                                onChange={(e) => handleItemChange(index, "matchPattern", e.target.value)}
                                                placeholder="e.g. /partner/${roleId}/dashboard"
                                            />
                                        </div>
                                    </div>
                                    <Button variant="outline" className="text-red-500 hover:text-red-600 border-red-200 bg-red-50 hover:bg-red-100" size="sm" onClick={() => handleRemoveItem(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
