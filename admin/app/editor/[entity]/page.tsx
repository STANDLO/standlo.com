"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, CheckCircle, AlertTriangle, ArrowLeft, Type, Hash, ToggleLeft, List, Image as ImageIcon, MapPin, Search, Calendar, CreditCard, Puzzle, Settings2, Code, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FieldMeta {
    name: string;
    code: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    meta: Record<string, any>;
    zodType?: string;
    isRequired?: boolean;
}

const UI_TYPES = [
    { type: 'text', icon: Type, label: 'Text Input' },
    { type: 'number', icon: Hash, label: 'Number' },
    { type: 'boolean', icon: ToggleLeft, label: 'Toggle/Switch' },
    { type: 'select', icon: List, label: 'Select Dropdown' },
    { type: 'textarea', icon: Type, label: 'Text Area' },
    { type: 'localized', icon: Puzzle, label: 'Localized (Multi-lang)' },
    { type: 'lookup', icon: Search, label: 'Relational Lookup' },
    { type: 'place', icon: MapPin, label: 'Maps Autocomplete' },
    { type: 'date', icon: Calendar, label: 'Date Picker' },
    { type: 'gallery', icon: ImageIcon, label: 'Image Gallery' },
    { type: 'vat', icon: CreditCard, label: 'VAT Input' },
];

export default function EditorPage() {
    const { entity } = useParams();
    const router = useRouter();

    // Server State
    const [fields, setFields] = useState<FieldMeta[]>([]);
    const [policies, setPolicies] = useState<Record<string, string>>({});
    const [rawCode, setRawCode] = useState("");
    const [registryConfig, setRegistryConfig] = useState<{ scope: string; collectionName: string }>({ scope: "tenant", collectionName: "" });

    // UI State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string[] | null>(null);
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<"visual" | "code" | "rbac" | "settings">("visual");

    // Editor State
    const [selectedFieldName, setSelectedFieldName] = useState<string | null>(null);
    const [newEntityName, setNewEntityName] = useState("");
    const [renaming, setRenaming] = useState(false);

    // Rebuild AST String Code automatically
    useEffect(() => {
        if (!fields.length || !rawCode || loading) return;

        const rebuildCode = () => {
            const fieldsCode = fields.map(f => {
                let zChain = f.zodType && f.zodType !== 'any' ? `z.${f.zodType}()` : 'z.string()';
                if (!f.isRequired) zChain += '.optional()';
                if (f.meta && Object.keys(f.meta).length > 0) {
                    zChain += `.describe(JSON.stringify(${JSON.stringify(f.meta)}))`;
                }
                return `    ${f.name}: ${zChain},`;
            }).join('\n');

            const match = rawCode.match(/([A-Z]\w+Schema\s*=\s*[A-Za-z]+Schema\.extend\(\{)([\s\S]*?)(\}\);)/);
            if (match) {
                const newCode = rawCode.replace(match[0], `${match[1]}\n${fieldsCode}\n${match[3]}`);
                if (newCode !== rawCode) {
                    setRawCode(newCode);
                }
            } else {
                // Fallback for schemas constructed directly with z.object({
                const matchObj = rawCode.match(/([A-Z]\w+Schema\s*=\s*z\.object\(\{)([\s\S]*?)(\}\);)/);
                if (matchObj) {
                    const newCode = rawCode.replace(matchObj[0], `${matchObj[1]}\n${fieldsCode}\n${matchObj[3]}`);
                    if (newCode !== rawCode) {
                        setRawCode(newCode);
                    }
                }
            }
        };
        rebuildCode();

        // We only rebuild when the visual tab changes a field to avoid infinite loops
        // The generate code button will explicitly trigger this.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fields]); // Deliberate minimal dependency

    const handleRename = async () => {
        if (!newEntityName) return alert("Enter a new name first.");
        const sure = confirm(`Are you absolutely sure you want to rename '${entity}' to '${newEntityName}'? This will edit multiple system files via AST.`);
        if (!sure) return;

        setRenaming(true);
        try {
            const res = await fetch("/admin/api/schemas/rename", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    oldEntity: entity,
                    newEntity: newEntityName
                })
            });
            const data = await res.json();
            if (data.success) {
                alert("Entity renamed successfully!");
                router.push(`/editor/${newEntityName}`);
            } else {
                alert("Rename failed: " + data.error);
            }
        } catch (e: unknown) {
            if (e instanceof Error) {
                alert("Error renaming: " + e.message);
            } else {
                alert("Error renaming: Unknown error");
            }
        } finally {
            setRenaming(false);
        }
    };

    const addField = (uiConfig: typeof UI_TYPES[0]) => {
        const fieldName = prompt("Enter new field name (camelCase):", "newField");
        if (!fieldName || fields.find(f => f.name === fieldName)) return alert("Invalid or duplicate name");

        let defaultZodType = "string";
        if (uiConfig.type === "number") defaultZodType = "number";
        if (uiConfig.type === "boolean") defaultZodType = "boolean";
        if (uiConfig.type === "gallery") defaultZodType = "array";

        const newField: FieldMeta = {
            name: fieldName,
            zodType: defaultZodType,
            isRequired: false,
            meta: { type: uiConfig.type, label: fieldName.charAt(0).toUpperCase() + fieldName.slice(1) },
            code: ""
        };

        const updatedFields = [...fields, newField];
        setFields(updatedFields);
        setSelectedFieldName(fieldName);

        // Force Code Rebuild
        triggerCompilation(updatedFields);
    };

    const updateSelectedField = (updates: Partial<FieldMeta>) => {
        if (!selectedFieldName) return;

        const updatedFields = fields.map(f => {
            if (f.name === selectedFieldName) {
                return { ...f, ...updates };
            }
            return f;
        });

        setFields(updatedFields);
        triggerCompilation(updatedFields);
    };

    const triggerCompilation = (currentFields: FieldMeta[]) => {
        const fieldsCode = currentFields.map(f => {
            let zChain = f.zodType && f.zodType !== 'any' ? `z.${f.zodType}()` : 'z.string()';
            if (!f.isRequired) zChain += '.optional()';
            if (f.meta && Object.keys(f.meta).length > 0) {
                zChain += `.describe(JSON.stringify(${JSON.stringify(f.meta)}))`;
            }
            return `    ${f.name}: ${zChain},`;
        }).join('\n');

        let newCode = rawCode;
        const match = newCode.match(/([A-Z]\w+Schema\s*=\s*[A-Za-z]+Schema\.extend\(\{)([\s\S]*?)(\}\);)/);
        if (match) {
            newCode = newCode.replace(match[0], `${match[1]}\n${fieldsCode}\n${match[3]}`);
        } else {
            const matchObj = newCode.match(/([A-Z]\w+Schema\s*=\s*z\.object\(\{)([\s\S]*?)(\}\);)/);
            if (matchObj) {
                newCode = newCode.replace(matchObj[0], `${matchObj[1]}\n${fieldsCode}\n${matchObj[3]}`);
            }
        }

        setRawCode(newCode);
    };

    useEffect(() => {
        fetch(`/admin/api/schemas/${entity}`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setFields(data.fields);
                    setPolicies(data.policies);
                    setRawCode(data.rawCode);
                    if (data.registryConfig) {
                        setRegistryConfig(data.registryConfig);
                    }
                }
            })
            .finally(() => setLoading(false));
    }, [entity]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch(`/admin/api/schemas/${entity}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rawCode,
                    newScope: registryConfig.scope,
                    newCollectionName: registryConfig.collectionName
                })
            });
            const data = await res.json();

            if (data.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                setError(data.errors || [data.error]);
            }
        } catch (e: unknown) {
            if (e instanceof Error) {
                setError([e.message]);
            } else {
                setError(["An unknown error occurred"]);
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 animate-pulse text-muted-foreground flex items-center justify-center h-screen">Loading AST Pipeline for {entity}...</div>;

    const selectedField = fields.find(f => f.name === selectedFieldName);

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="flex-none p-4 flex items-center justify-between border-b border-border bg-card shadow-sm z-10">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                    <div>
                        <h1 className="text-xl font-bold capitalize flex items-center">
                            <Puzzle className="w-5 h-5 mr-2 text-primary" /> {entity}
                        </h1>
                        <p className="text-xs text-muted-foreground">functions/src/schemas/{entity}.ts</p>
                    </div>
                </div>

                <div className="flex items-center bg-muted p-1 rounded-lg">
                    <button onClick={() => setActiveTab("visual")} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'visual' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Visual Builder</button>
                    <button onClick={() => setActiveTab("code")} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'code' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Source Code</button>
                    <button onClick={() => setActiveTab("rbac")} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'rbac' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>RBAC Matrix</button>
                    <button onClick={() => setActiveTab("settings")} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center ${activeTab === 'settings' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}><Settings2 className="w-4 h-4 mr-1" /> Settings</button>
                </div>

                <div className="flex items-center space-x-3">
                    {success && <span className="text-green-600 text-xs font-bold flex items-center bg-green-50 px-2 py-1 rounded"><CheckCircle className="h-3 w-3 mr-1" /> Synced</span>}
                    <Button onClick={handleSave} disabled={saving} size="sm" className="shadow-md">
                        {saving ? "Compiling..." : <><Save className="mr-2 h-4 w-4" /> Save AST</>}
                    </Button>
                </div>
            </header>

            {/* Error Banner */}
            {error && (
                <div className="flex-none p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-b border-red-200 dark:border-red-900/50">
                    <div className="font-bold flex items-center text-sm"><AlertTriangle className="h-4 w-4 mr-2" /> Compilation Failed</div>
                    <ul className="list-disc list-inside text-xs font-mono mt-1">
                        {error.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === "visual" && (
                    <div className="flex h-full">
                        {/* Toolbox Sidebar */}
                        <div className="w-64 border-r border-border bg-card/50 p-4 flex flex-col h-full overflow-y-auto hidden md:flex">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Add Field (Toolbox)</h3>
                            <div className="grid grid-cols-1 gap-2">
                                {UI_TYPES.map((ui) => {
                                    const Icon = ui.icon;
                                    return (
                                        <button
                                            key={ui.type}
                                            onClick={() => addField(ui)}
                                            className="flex items-center p-2 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left group"
                                        >
                                            <div className="bg-muted p-1.5 rounded mr-3 group-hover:bg-primary/10 group-hover:text-primary">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{ui.label}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">{ui.type}</div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Visual Canvas */}
                        <div className="flex-1 bg-muted/30 p-8 overflow-y-auto">
                            <div className="max-w-2xl mx-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold">Schema Fields</h2>
                                    <Button size="sm" variant="outline" className="h-8" onClick={() => addField(UI_TYPES[0])}><Plus className="w-4 h-4 mr-2" /> Add Field</Button>
                                </div>
                                <div className="space-y-3">
                                    {fields.map(f => {
                                        const isSelected = selectedFieldName === f.name;
                                        const uiConf = UI_TYPES.find(u => u.type === f.meta?.type);
                                        const Icon = uiConf ? uiConf.icon : Type;

                                        return (
                                            <div
                                                key={f.name}
                                                onClick={() => setSelectedFieldName(f.name)}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'border-primary ring-1 ring-primary shadow-md bg-card' : 'border-border bg-card hover:border-muted-foreground/30'}`}
                                            >
                                                <div className="flex items-center">
                                                    <div className={`p-2 rounded-lg mr-4 ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold flex items-center">
                                                            {f.name}
                                                            {f.isRequired && <span className="ml-2 text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded">REQUIRED</span>}
                                                            {f.meta?.readOnly && <span className="ml-2 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">READONLY</span>}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5 font-mono">{f.zodType || 'z.any()'} • {f.meta?.type || 'No UI Enum'}</div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Settings2 className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-muted-foreground/30'}`} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Inspector Sidebar */}
                        <div className="w-80 border-l border-border bg-card flex flex-col h-full overflow-hidden">
                            {selectedField ? (
                                <div className="p-4 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                                        <h3 className="font-bold flex items-center"><Settings2 className="w-4 h-4 mr-2 text-primary" /> Properties</h3>
                                        <button onClick={() => setSelectedFieldName(null)} className="text-muted-foreground hover:text-foreground text-xs font-medium">Close</button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Field Identity</label>
                                            <div>
                                                <label className="text-xs mb-1 block">Key Name (DB)</label>
                                                <input disabled value={selectedField.name} className="w-full text-sm p-2 bg-muted/50 border border-border rounded-md font-mono" />
                                            </div>
                                            <div>
                                                <label className="text-xs mb-1 block">UI Type</label>
                                                <select
                                                    className="w-full text-sm p-2 border border-border rounded-md bg-card"
                                                    value={selectedField.meta?.type || ''}
                                                    onChange={e => updateSelectedField({ meta: { ...selectedField.meta, type: e.target.value } })}
                                                >
                                                    <option value={selectedField.meta?.type}>{selectedField.meta?.type || 'Select type...'}</option>
                                                    {UI_TYPES.map(ui => <option key={ui.type} value={ui.type}>{ui.label}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Zod Constraints</label>
                                            <div className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/20">
                                                <div className="text-sm font-medium">Required Field</div>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedField.isRequired || false}
                                                    onChange={e => updateSelectedField({ isRequired: e.target.checked })}
                                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/20">
                                                <div className="text-sm font-medium">Read Only UI</div>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedField.meta?.readOnly || false}
                                                    onChange={e => updateSelectedField({ meta: { ...selectedField.meta, readOnly: e.target.checked } })}
                                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase">Raw AST View</label>
                                            <pre className="text-[10px] p-3 rounded-md bg-[#1e1e1e] text-[#d4d4d4] overflow-x-auto font-mono whitespace-pre-wrap">
                                                {selectedField.code}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                                    <Puzzle className="w-12 h-12 mb-4 opacity-20" />
                                    <h3 className="font-bold text-foreground">No Field Selected</h3>
                                    <p className="text-xs mt-2">Select a field from the canvas to edit its Zod constraints and UI Meta properties.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === "code" && (
                    <div className="h-full flex flex-col bg-[#1e1e1e]">
                        <div className="flex items-center justify-between p-2 bg-[#2d2d2d] border-b border-black/50 text-xs text-[#cccccc]">
                            <div className="flex items-center"><Code className="w-4 h-4 mr-2" /> Safe Generation Target</div>
                            <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded">Manual Edit Mode</span>
                        </div>
                        <textarea
                            className="flex-1 w-full bg-transparent text-[#d4d4d4] p-4 font-mono text-sm focus:outline-none resize-none"
                            value={rawCode}
                            onChange={(e) => setRawCode(e.target.value)}
                            spellCheck={false}
                        />
                    </div>
                )}

                {activeTab === "rbac" && (
                    <div className="h-full p-8 overflow-y-auto bg-muted/10">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <h2 className="text-xl font-bold flex items-center"><Settings2 className="w-6 h-6 mr-3 text-primary" /> Sub Schema Policies (Omit/Pick)</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {Object.keys(policies).map(role => (
                                    <div key={role} className="flex flex-col border border-border rounded-xl bg-card shadow-sm overflow-hidden">
                                        <div className="p-3 border-b border-border bg-muted/30 font-bold capitalize">{role} Schema</div>
                                        <pre className="p-4 text-xs font-mono overflow-auto flex-1">
                                            {policies[role]}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "settings" && (
                    <div className="h-full p-8 overflow-y-auto bg-muted/10">
                        <div className="max-w-2xl mx-auto space-y-8 bg-card p-8 rounded-xl border border-border mt-10 shadow-sm">
                            <div className="border-b border-border pb-4">
                                <h2 className="text-xl font-bold flex items-center"><Settings2 className="w-6 h-6 mr-3 text-primary" /> Entity Registry Settings</h2>
                                <p className="text-sm text-muted-foreground mt-1">Configure global accessibility and Firestore collection overrides.</p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold block mb-2">Namespace Scope</label>
                                    <select
                                        className="w-full p-3 bg-muted/50 border border-border rounded-lg text-sm"
                                        value={registryConfig.scope}
                                        onChange={(e) => setRegistryConfig(prev => ({ ...prev, scope: e.target.value }))}
                                    >
                                        <option value="tenant">Tenant (Scoped to specific operations/clients)</option>
                                        <option value="global">Global (Platform-wide, unscoped metrics/core)</option>
                                    </select>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        If <b>global</b>, the API gateway will ignore the multi-tenant fair rules and store it flatly.
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-bold block mb-2">Firestore Collection Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 bg-muted/50 border border-border rounded-lg text-sm font-mono"
                                        value={registryConfig.collectionName}
                                        onChange={(e) => setRegistryConfig(prev => ({ ...prev, collectionName: e.target.value }))}
                                        placeholder={`Default: ${entity}s`}
                                    />
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Useful for overriding standard pluralization (i.e. if the collection is named entirely differently in Firestore).
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border mt-8 flex justify-end">
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? "Updating Registry..." : "Save Registry Config"}
                                </Button>
                            </div>

                            <div className="mt-12 pt-8 border-t border-red-500/20">
                                <h3 className="text-red-500 font-bold flex items-center mb-2">
                                    <AlertTriangle className="w-5 h-5 mr-2" /> Danger Zone: Rename Entity
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Renaming an entity will change its filename, rewrite AST schema identifiers, and alter its Registry keys system-wide.
                                </p>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="text"
                                        className="flex-1 p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-sm text-red-600 focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-red-300"
                                        placeholder={`New name for ${entity} (e.g. newEntity)`}
                                        value={newEntityName}
                                        onChange={e => setNewEntityName(e.target.value)}
                                    />
                                    <Button
                                        variant="outline"
                                        className="text-red-500 border-red-200 hover:bg-red-500 hover:text-white"
                                        onClick={handleRename}
                                        disabled={renaming || !newEntityName || newEntityName === entity}
                                    >
                                        {renaming ? "Migrating AST..." : "Proceed with Rename"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
