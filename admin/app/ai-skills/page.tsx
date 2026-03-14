"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Plus, Brain, Trash2, Edit, Play, Loader2, Save, Settings, Code2, Container, CloudUpload } from "lucide-react";
import { OrchestratorClient } from "../lib/orchestratorClient";

interface AISkillDocument {
    id: string;
    skillId: string;
    displayName: string;
    description: string;
    prompt: string;
    inputSchemaJson: string;
    outputSchemaJson: string;
    modelName: string;
    mockPayloadJson?: string;
    outputFormat?: 'text' | 'json' | 'media';
}

export default function AISkillsPage() {
    const [skills, setSkills] = useState<AISkillDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [activeSkill, setActiveSkill] = useState<Partial<AISkillDocument> | null>(null);

    // Test Runner State
    const [testPayload, setTestPayload] = useState('{\n  "input": "test"\n}');
    const [testResult, setTestResult] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [isSyncing, setIsSyncing] = useState<string | null>(null);

    const handleSyncToCloud = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Overwrite this AI Skill in the Production Cloud? This is irreversible.")) return;
        setIsSyncing(id);
        try {
            const res = await fetch('/api/sync-doc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionName: 'ai_skills', documentId: id })
            });
            const data = await res.json();
            if (data.success) {
                alert("Successfully synced to Production Cloud!");
            } else {
                console.error(data.log);
                alert("Sync failed. Check console.");
            }
        } catch (error) {
            console.error(error);
            alert("Sync request failed.");
        } finally {
            setIsSyncing(null);
        }
    };

    const fetchSkills = async () => {
        setLoading(true);
        try {
            const data = await OrchestratorClient.list<AISkillDocument>("ai_skill");
            setSkills(data);
        } catch (error) {
            console.error("Failed to fetch skills", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSkills();
    }, []);

    const handleCreateNew = () => {
        setActiveSkill({
            skillId: '',
            displayName: '',
            description: '',
            prompt: 'You are an AI assistant. Context: {{input}}',
            modelName: 'googleai/gemini-2.5-flash',
            outputFormat: 'json',
            inputSchemaJson: '{\n  "type": "object",\n  "properties": {}\n}',
            outputSchemaJson: '{\n  "type": "object",\n  "properties": {}\n}',
            mockPayloadJson: '{\n  "input": "test"\n}'
        });
        setTestPayload('{\n  "input": "test"\n}');
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!activeSkill?.skillId || !activeSkill?.displayName) {
            alert("Skill ID and Display Name are required");
            return;
        }

        try {
            // Auto-correct legacy model names on save
            const payloadToSave = { ...activeSkill, mockPayloadJson: testPayload };
            if (payloadToSave.modelName === 'googleai/gemini-3.0-pro-preview') {
                payloadToSave.modelName = 'googleai/gemini-3.1-pro-preview';
            }
            if (payloadToSave.modelName === 'googleai/gemini-3.0-flash-preview') {
                payloadToSave.modelName = 'googleai/gemini-3-flash-preview';
            }

            if (activeSkill.id) {
                await OrchestratorClient.update("ai_skill", payloadToSave as Record<string, unknown>);
            } else {
                await OrchestratorClient.create("ai_skill", payloadToSave as Record<string, unknown>);
            }
            setIsEditing(false);
            setActiveSkill(null);
            fetchSkills();
        } catch (error) {
            console.error("Failed to save skill", error);
            alert("Failed to save skill");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this AI skill?")) return;
        try {
            await OrchestratorClient.delete("ai_skill", id);
            fetchSkills();
        } catch (error) {
            console.error("Failed to delete skill", error);
            alert("Failed to delete skill");
        }
    };

    const handleSeedData = async () => {
        if (!confirm("Warning: This will reload the local static seed for AI Skills into Firestore, overwriting existing matching documents. Proceed?")) return;
        setLoading(true);
        try {
            const res = await fetch('/api/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target: 'ai_skills' })
            });
            const data = await res.json();
            if (data.success) {
                alert("AI Skills Seeded Successfully!");
                fetchSkills();
            } else {
                alert("Failed to seed AI Skills: " + data.error);
                setLoading(false);
            }
        } catch (error) {
            console.error("Failed to execute seed", error);
            alert("Execution failed.");
            setLoading(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult("Executing AI Skill on Genkit...");
        try {
            let mockPayload;
            try {
                mockPayload = JSON.parse(testPayload);
            } catch {
                setTestResult("Invalid JSON in Test Payload.");
                setIsTesting(false);
                return;
            }

            // Auto-correct legacy model names before testing
            const testSkill = { ...activeSkill };
            if (testSkill.modelName === 'googleai/gemini-3.0-pro-preview') {
                testSkill.modelName = 'googleai/gemini-3.1-pro-preview';
            }
            if (testSkill.modelName === 'googleai/gemini-3.0-flash-preview') {
                testSkill.modelName = 'googleai/gemini-3-flash-preview';
            }

            const response = await OrchestratorClient.call({
                entityId: "ai_skill",
                actionId: "test_ai_skill",
                payload: {
                    skill: testSkill,
                    mockPayload
                }
            });

            const resPayload = response as unknown as { success?: boolean; result?: unknown; error?: string };

            if (resPayload.success) {
                if (typeof resPayload.result === 'string') {
                    setTestResult(resPayload.result);
                } else if (resPayload.result && typeof resPayload.result === 'object') {
                    setTestResult(JSON.stringify(resPayload.result, null, 2));
                } else {
                    setTestResult(String(resPayload.result));
                }
            } else {
                setTestResult(resPayload.error || JSON.stringify(resPayload, null, 2));
            }
        } catch (error) {
            setTestResult("Error: " + (error as Error).message);
        } finally {
            setIsTesting(false);
        }
    };

    if (isEditing && activeSkill) {
        return (
            <div className="p-8 h-full flex flex-col space-y-6 overflow-y-auto bg-muted/20">
                <header className="border-b border-border pb-6 flex justify-between items-center bg-card p-6 rounded-lg shadow-sm">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center">
                            <Brain className="mr-3 text-purple-600" />
                            {activeSkill.id ? 'Edit AI Skill' : 'Create New AI Skill'}
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Define the system prompt, model constraints, and structured schemas for this dynamic Genkit logic node.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700 text-white">
                            <Save className="w-4 h-4 mr-2" />
                            Save Skill
                        </Button>
                    </div>
                </header>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-1">
                    {/* LEFT COLUMN: Configuration */}
                    <div className="xl:col-span-8 flex flex-col gap-6">
                        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-bold flex items-center mb-6">
                                <Settings className="w-5 h-5 mr-2 text-primary" />
                                Core Configuration
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-muted-foreground">Skill ID (Unique Identifier)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background border border-border rounded-md p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="e.g. ai_sentiment_analysis"
                                        value={activeSkill.skillId || ''}
                                        onChange={(e) => setActiveSkill({ ...activeSkill, skillId: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-muted-foreground">Display Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-background border border-border rounded-md p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                                        placeholder="e.g. Sentiment Analysis"
                                        value={activeSkill.displayName || ''}
                                        onChange={(e) => setActiveSkill({ ...activeSkill, displayName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-muted-foreground">AI Model Engine</label>
                                    <select
                                        className="w-full bg-background border border-border rounded-md p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                                        value={activeSkill.modelName || 'googleai/gemini-2.5-flash'}
                                        onChange={(e) => setActiveSkill({ ...activeSkill, modelName: e.target.value })}
                                    >
                                        <optgroup label="Gemini 3 Preview (Multimodal)">
                                            <option value="googleai/gemini-3.1-pro-preview">Gemini 3.1 Pro (Preview)</option>
                                            <option value="googleai/gemini-3-pro-preview">Gemini 3.0 Pro (Preview)</option>
                                            <option value="googleai/gemini-3-pro-image-preview">Gemini 3.0 Pro Image (Preview)</option>
                                            <option value="googleai/gemini-3.1-flash-image-preview">Gemini 3.1 Flash Image (Preview)</option>
                                            <option value="googleai/gemini-3-flash-preview">Gemini 3.0 Flash (Preview)</option>
                                            <option value="googleai/gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite (Preview)</option>
                                        </optgroup>
                                        <optgroup label="Gemini Legacy">
                                            <option value="googleai/gemini-2.5-pro">Gemini 2.5 Pro</option>
                                            <option value="googleai/gemini-2.5-flash">Gemini 2.5 Flash</option>
                                            <option value="googleai/gemini-2.5-flash-image">Gemini 2.5 Flash Image</option>
                                            <option value="googleai/gemini-2.0-flash">Gemini 2.0 Flash</option>
                                            <option value="googleai/gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                                        </optgroup>
                                        <optgroup label="Image Generation (Imagen 4)">
                                            <option value="googleai/imagen-4.0-generate-001">Imagen 4.0 Generate</option>
                                            <option value="googleai/imagen-4.0-fast-generate-001">Imagen 4.0 Fast Generate</option>
                                            <option value="googleai/imagen-4.0-ultra-generate-001">Imagen 4.0 Ultra Generate</option>
                                        </optgroup>
                                        <optgroup label="Video Generation (Veo 3)">
                                            <option value="googleai/veo-3.1-generate-preview">Veo 3.1 Generate Preview</option>
                                            <option value="googleai/veo-3.0-generate-001">Veo 3.0 Generate</option>
                                        </optgroup>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-muted-foreground">Output Format Definition</label>
                                    <select
                                        className="w-full bg-background border border-border rounded-md p-2.5 focus:ring-2 focus:ring-primary focus:outline-none"
                                        value={activeSkill.outputFormat || 'json'}
                                        onChange={(e) => setActiveSkill({ ...activeSkill, outputFormat: e.target.value as 'text' | 'json' | 'media' })}
                                    >
                                        <option value="json">Structured JSON (Requires Schema)</option>
                                        <option value="text">Raw Text (No Schema)</option>
                                        <option value="media">Media Object (Images / Video)</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold mb-1 text-muted-foreground">Internal Description</label>
                                    <textarea
                                        className="w-full bg-background border border-border rounded-md p-2.5 h-20 focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                        placeholder="Describe what this AI skill does for your team to understand its purpose..."
                                        value={activeSkill.description || ''}
                                        onChange={(e) => setActiveSkill({ ...activeSkill, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-lg shadow-sm p-6 flex flex-col flex-1">
                            <h2 className="text-lg font-bold flex items-center mb-2">
                                <Code2 className="w-5 h-5 mr-2 text-green-500" />
                                Genkit System Prompt
                            </h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                Use standard Handlebars syntax {'{{variable}}'} to dynamically inject your payload context into the prompt at runtime. Let Genkit figure out the rest.
                            </p>
                            <textarea
                                className="w-full bg-zinc-950 text-green-400 font-mono text-[15px] leading-relaxed border border-border rounded-md p-5 flex-1 focus:ring-2 focus:ring-green-500 focus:outline-none min-h-[250px] shadow-inner"
                                value={activeSkill.prompt || ''}
                                onChange={(e) => setActiveSkill({ ...activeSkill, prompt: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Interfaces & Testing */}
                    <div className="xl:col-span-4 flex flex-col gap-6">

                        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
                            <h2 className="text-lg font-bold flex items-center mb-4">
                                <Container className="w-5 h-5 mr-2 text-blue-500" />
                                Data Interfaces (Zod)
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-sm font-semibold text-muted-foreground">Input Context Schema (Optional)</label>
                                    </div>
                                    <textarea
                                        className="w-full bg-zinc-950 text-blue-400 font-mono text-xs border border-border rounded-md p-4 h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-inner"
                                        value={activeSkill.inputSchemaJson || ''}
                                        placeholder={'{\n  "type": "object",\n  "properties": {}\n}'}
                                        onChange={(e) => setActiveSkill({ ...activeSkill, inputSchemaJson: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Defines the expected shape of the payload sent to the prompt.</p>
                                </div>
                                <hr className="border-border/50" />
                                <div className={activeSkill.outputFormat !== 'json' ? 'opacity-50 pointer-events-none' : ''}>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-sm font-semibold text-muted-foreground flex items-center">
                                            Output JSON Schema
                                            {activeSkill.outputFormat !== 'json' && <span className="ml-2 text-xs text-red-400">(Disabled by Format)</span>}
                                        </label>
                                    </div>
                                    <textarea
                                        className="w-full bg-zinc-950 text-amber-400 font-mono text-xs border border-border rounded-md p-4 h-48 focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-inner"
                                        value={activeSkill.outputSchemaJson || ''}
                                        placeholder={'{\n  "type": "object",\n  "properties": {}\n}'}
                                        onChange={(e) => setActiveSkill({ ...activeSkill, outputSchemaJson: e.target.value })}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Forces the AI to respond precisely in this JSON structure.</p>
                                </div>
                            </div>
                        </div>

                        {/* TEST RUNNER */}
                        <div className="bg-card border border-primary/20 rounded-lg shadow-sm p-6 flex flex-col flex-1 ring-1 ring-primary/10">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-border/50">
                                <h2 className="text-lg font-bold flex items-center">
                                    <Play className="w-5 h-5 mr-2 text-primary animate-pulse" />
                                    Genkit Sandbox
                                </h2>
                                <Button size="sm" onClick={handleTest} disabled={isTesting} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md">
                                    {isTesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                    {isTesting ? 'Running Execution...' : 'Execute Test'}
                                </Button>
                            </div>

                            <div className="flex-1 flex flex-col space-y-4">
                                <div className="flex-1 flex flex-col min-h-[150px]">
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Mock JSON Payload</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setTestPayload('{\n  "input": "test"\n}')}
                                                className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
                                            >
                                                [Basic]
                                            </button>
                                            <button
                                                onClick={() => setTestPayload('{\n  "webhook": {\n    "body": {\n      "message": "Hello"\n    }\n  }\n}')}
                                                className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
                                            >
                                                [Webhook]
                                            </button>
                                            <button
                                                onClick={() => setTestPayload('{\n  "database": {\n    "entityId": "part",\n    "action": "create",\n    "data": {\n      "name": "New Part"\n    }\n  }\n}')}
                                                className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
                                            >
                                                [Firestore]
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        className="flex-1 w-full bg-zinc-950 text-blue-300 font-mono text-[13px] border border-border rounded-md p-4 shadow-inner focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        value={testPayload}
                                        onChange={(e) => setTestPayload(e.target.value)}
                                        placeholder='{"key": "value"}'
                                    />
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <label className="text-sm font-semibold text-muted-foreground mb-2">Genkit Output Result</label>
                                    <textarea
                                        className="flex-1 w-full bg-black text-green-400 font-mono text-[13px] border border-border/50 rounded-md p-4 shadow-inner"
                                        readOnly
                                        value={testResult}
                                        placeholder='Awaiting execution block...'
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 h-full flex flex-col space-y-6">
            <header className="border-b border-border pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold flex items-center">
                        <Brain className="mr-3 text-purple-600" />
                        AI Skills Manager
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage dynamic Genkit prompts and schemas for the Standlo Pipeline Engine.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSeedData} className="flex items-center gap-2 border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-900/50 dark:hover:bg-purple-900/20">
                        <CloudUpload className="w-4 h-4" /> Seed Local Skills
                    </Button>
                    <Button onClick={handleCreateNew} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" /> New AI Skill
                    </Button>
                </div>
            </header>

            <div className="flex-1 bg-card rounded-xl border border-border overflow-hidden p-6">
                {loading ? (
                    <div className="text-center text-muted-foreground py-12">Loading AI Skills...</div>
                ) : skills.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">No AI Skills found. Create your first one!</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {skills.map(skill => (
                            <div key={skill.id} className="border border-border rounded-lg p-5 bg-background shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg text-foreground">{skill.displayName}</h3>
                                    <div className="flex gap-2 text-muted-foreground">
                                        <button onClick={(e) => handleSyncToCloud(e, skill.id)} disabled={isSyncing === skill.id} className="hover:text-blue-600 transition-colors" title="Sync to Production Cloud">
                                            {isSyncing === skill.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => { setActiveSkill(skill); setIsEditing(true); if (skill.mockPayloadJson) setTestPayload(skill.mockPayloadJson); else setTestPayload('{\n  "input": "test"\n}'); }} className="hover:text-purple-600 transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(skill.id)} className="hover:text-red-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs font-mono text-purple-600/80 dark:text-purple-400/80 mb-3 bg-purple-50 dark:bg-purple-900/20 inline-block px-2 py-1 rounded">
                                    {skill.skillId}
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                    {skill.description}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
