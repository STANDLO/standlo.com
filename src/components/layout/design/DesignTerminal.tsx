import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Terminal, Command } from "lucide-react";
import { DesignController } from "@/lib/design";
import { useDesignStore } from "@/lib/zustand";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { DesignTools as PDMTools } from "../../../../functions/src/core/constants";

export function DesignTerminal() {
    const t = useTranslations("Canvas.tools");
    const [promptText, setPromptText] = useState("");
    const [history, setHistory] = useState<string[]>([]);
    
    // Autocomplete UI State
    const [suggestions, setSuggestions] = useState<{label: string; value: string}[]>([]);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const params = useParams();
    const designId = (params?.uid as string) || (params?.id as string) || (params?.entity as string);

    const entities = useDesignStore(state => state.entities);
    const selectedEntityId = useDesignStore(state => state.selectedEntityId);
    const selectEntity = useDesignStore(state => state.selectEntity);
    const selectedEntity = selectedEntityId ? entities[selectedEntityId] : null;

    // Populate prompt when clicking entity in 3D
    useEffect(() => {
        if (selectedEntityId && !promptText.includes(`@${selectedEntityId}`)) {
            if (promptText === "" || promptText.endsWith(" ")) {
                setPromptText(prev => prev + `@${selectedEntityId} `);
            }
        }
    }, [selectedEntityId, promptText]);

    // Value Scrubbing + Dropdown Navigation
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
                return;
            }
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                applySuggestion(suggestions[suggestionIndex].value);
                return;
            }
        }

        // Numeric Value Scrubbing
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            const input = e.currentTarget;
            const cursorStart = input.selectionStart || 0;
            const text = input.value;
            
            // Find if cursor is inside a numeric parameter like /x+1.5 or /y-0.001
            const matchParams = /(?:\/)([xyz])([+-]?\d*\.?\d+)/gi;
            let match;
            while ((match = matchParams.exec(text)) !== null) {
                const start = match.index;
                const end = start + match[0].length;
                if (cursorStart >= start && cursorStart <= end) {
                    e.preventDefault();
                    const axis = match[1];
                    const numStr = match[2];
                    let val = parseFloat(numStr);
                    if (isNaN(val)) return;

                    const delta = e.shiftKey ? 1.0 : 0.001;
                    val += e.key === "ArrowUp" ? delta : -delta;

                    // Re-construct string with new format
                    const formattedVal = numStr.includes('.') ? val.toFixed(3) : val.toString();
                    const prefix = (numStr.startsWith('+') && val > 0) ? '+' : '';
                    
                    const newText = text.substring(0, start) + `/${axis}${prefix}${formattedVal}` + text.substring(end);
                    setPromptText(newText);
                    
                    // Optional: Live preview applying change locally without committing to history
                    // liveExecuteCommand(newText);
                    return;
                }
            }
        }
    };

    const applySuggestion = (val: string) => {
        const words = promptText.split(" ");
        words[words.length - 1] = val + " ";
        setPromptText(words.join(" "));
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setPromptText(val);

        const words = val.split(" ");
        const lastWord = words[words.length - 1] || "";

        if (lastWord.startsWith("@")) {
            const search = lastWord.slice(1).toLowerCase();
            const matched = Object.values(entities)
                .filter(ent => ent.id.toLowerCase().includes(search) || (ent.metadata?.name && String(ent.metadata.name).toLowerCase().includes(search)))
                .map(ent => ({ label: `[${ent.type}] ${ent.metadata?.name || ent.baseEntityId}`, value: `@${ent.id}` }));
            setSuggestions(matched.slice(0, 5));
            setShowSuggestions(matched.length > 0);
            setSuggestionIndex(0);
        } else if (lastWord.startsWith("#")) {
            const search = lastWord.slice(1).toLowerCase();
            const tools = Object.values(PDMTools).map(t => ({ label: t.name.split('.').pop() || t.id, value: `#${t.id}` }));
            const actions = [
                { label: "Move Entity", value: "#move" },
                { label: "Rotate Entity", value: "#rotate" },
                { label: "Delete Entity", value: "#delete" },
                { label: "Add/Spawn", value: "#add" },
            ];
            const all = [...actions, ...tools].filter(t => t.value.toLowerCase().includes(search));
            setSuggestions(all.slice(0, 5));
            setShowSuggestions(all.length > 0);
            setSuggestionIndex(0);
        } else {
            setShowSuggestions(false);
        }
    };

    const parseCommand = async (cmdString: string) => {
        const tokens = cmdString.trim().split(" ").filter(t => t.length > 0);
        if (tokens.length === 0) return;

        let targets: string[] = [];
        let action = "";
        const paramMap: Record<string, string> = {};

        // V2 Syntax AST Parser
        for (const token of tokens) {
            if (token.startsWith("@")) {
                targets.push(token.substring(1));
            } else if (token.startsWith("#")) {
                action = token.substring(1).toLowerCase();
            } else if (token.startsWith("/")) {
                // e.g. /x+1, /y-0.5, /name_chair
                const match = token.match(/^\/([a-zA-Z_]+)(.*)$/);
                if (match) {
                    paramMap[match[1]] = match[2] || "true";
                }
            } else {
                // Legacy fallback parsing for raw strings
                if (!action) action = token.toLowerCase();
            }
        }

        if (targets.length === 0 && selectedEntityId) {
            targets = [selectedEntityId];
        }

        try {
            switch (action) {
                case "select":
                case "sel": {
                    if (targets.length === 0) {
                        selectEntity(null);
                        setHistory(prev => [...prev, `[OK] Cleared selection.`]);
                    } else {
                        selectEntity(targets[0]);
                        setHistory(prev => [...prev, `[OK] Selected ${targets[0]}.`]);
                    }
                    break;
                }
                case "move":
                case "m": {
                    for (const targetId of targets) {
                        const target = entities[targetId];
                        if (!target) continue;
                        
                        const newPos: [number, number, number] = [...target.position];
                        
                        // Mapping Z-Up system from terminal into Y-Up Three.js coordinates
                        ['x', 'z', 'y'].forEach((axis, idx) => {
                            if (paramMap[axis] !== undefined) {
                                const valStr = paramMap[axis];
                                const numericVal = parseFloat(valStr);
                                if (!isNaN(numericVal)) {
                                    if (valStr.startsWith('+') || valStr.startsWith('-')) {
                                        newPos[idx] += numericVal;
                                    } else {
                                        newPos[idx] = numericVal;
                                    }
                                }
                            }
                        });

                        DesignController.moveEntity(targetId, newPos);
                        setHistory(prev => [...prev, `[OK] Moved ${targetId} to [${newPos.map(n=>n.toFixed(2)).join(',')}]`]);

                        if (designId) {
                            const { callGateway } = await import("@/lib/api");
                            callGateway("orchestrator", {
                                actionId: "updateNode",
                                payload: {
                                    designId: designId,
                                    nodeId: targetId,
                                    position: newPos,
                                    rotation: target.rotation,
                                    metadata: target.metadata
                                }
                            }).catch(e => console.error("CLI Gateway Sync Error:", e));
                        }
                    }
                    break;
                }
                case "delete":
                case "rm":
                case "del": {
                    for (const targetId of targets) {
                        useDesignStore.getState().removeEntity(targetId);
                        setHistory(prev => [...prev, `[OK] Deleted ${targetId}. Pending cloud replication.`]);
                    }
                    if (targets.length > 0) selectEntity(null);
                    break;
                }
                case "add":
                case "spawn": {
                    // Usage e.g., #add @part /name_chair
                    const type = targets.length > 0 ? targets[0] : "part";
                    const query = paramMap['name'] || "generic";
                    setHistory(prev => [...prev, `[WARNING] #add pending catalog ElasticSearch query for: ${query} of type ${type}`]);
                    break;
                }
                case "help":
                case "?": {
                    setHistory(prev => [...prev, `STANDLO Design Terminal v2`]);
                    setHistory(prev => [...prev, `Syntax: @[target] #[action] /[param]`]);
                    setHistory(prev => [...prev, ``]);
                    setHistory(prev => [...prev, `[ACTIONS]`]);
                    setHistory(prev => [...prev, `  #move   - Muove l'entità (/x, /y, /z)`]);
                    setHistory(prev => [...prev, `  #rotate - Ruota l'entità (/x, /y, /z)`]);
                    setHistory(prev => [...prev, `  #delete - Rimuove l'entità selezionata`]);
                    setHistory(prev => [...prev, `  #add    - Genera una nuova entità`]);
                    setHistory(prev => [...prev, ``]);
                    setHistory(prev => [...prev, `[TOOLS]`]);
                    Object.values(PDMTools).forEach(tool => {
                        const toolName = t(tool.name.split('.').pop() || tool.id);
                        const descKey = tool.description.split('.').pop() || "";
                        const desc = descKey ? t(descKey) : tool.description;
                        setHistory(prev => [...prev, `  #${tool.id.padEnd(8)} - ${toolName}: ${desc}`]);
                    });
                    setHistory(prev => [...prev, ``]);
                    setHistory(prev => [...prev, `[EXAMPLES]`]);
                    setHistory(prev => [...prev, `  @uuid #move /x+1 /y-0.5  -> Movimento relativo (Z-Up supportato)`]);
                    setHistory(prev => [...prev, `  @uuid #move /z10         -> Imposta la Z assoluta a 10`]);
                    setHistory(prev => [...prev, `  #add @part /name_table   -> Genera p. catalog cercando 'table'`]);
                    setHistory(prev => [...prev, `  (Puoi usare Freccia SU/GIÙ per scorrere i valori numerici live)`]);
                    break;
                }
                default: {
                    if (action) {
                        setHistory(prev => [...prev, `[ERROR] Unknown tool/action: #${action}`]);
                    }
                    break;
                }
            }
        } catch (e) {
            setHistory(prev => [...prev, `[FATAL] Command execution failure: ${e}`]);
        }
    };

    const handlePromptSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!promptText.trim()) return;

        setHistory(prev => [...prev, `> ${promptText}`]);
        await parseCommand(promptText);
        setPromptText("");
        setShowSuggestions(false);
    };

    return (
        <div className="ui-design-terminal">
            {history.length > 0 && (
                <div className="ui-design-terminal-history">
                    {history.slice(-15).map((line, i) => (
                        <div key={i} className={`${line.startsWith('>') ? 'ui-design-terminal-history-item-echo' : line.includes('[ERROR]') ? 'ui-design-terminal-history-item-error' : line.includes('[OK]') ? 'ui-design-terminal-history-item-success' : line.includes('[WARNING]') ? 'ui-design-terminal-history-item-warning' : 'ui-design-terminal-history-item'}`}>
                            {line}
                        </div>
                    ))}
                </div>
            )}

            {selectedEntity && (
                <div className="ui-design-terminal-target">
                    <div className="flex items-center gap-2">
                        <div className="ui-design-terminal-target-badge">
                            TARGET: {selectedEntity.metadata?.name || selectedEntity.baseEntityId} (ID: {selectedEntity.id.split('-')[0]})
                        </div>
                        <div className="ui-design-terminal-target-pos">
                            POS: [{selectedEntity.position.map(n => n.toFixed(2)).join(', ')}]
                        </div>
                    </div>
                </div>
            )}
            
            <div className="relative">
                {showSuggestions && suggestions.length > 0 && (
                    <div className="ui-design-terminal-suggestions-container">
                        {suggestions.map((s, i) => (
                            <button
                                key={s.value}
                                type="button"
                                className={`ui-design-terminal-suggestion ${i === suggestionIndex ? 'ui-design-terminal-suggestion-active' : 'text-popover-foreground'}`}
                                onClick={() => applySuggestion(s.value)}
                            >
                                <span className="font-semibold">{s.value}</span> <span className="opacity-50 ml-2">{s.label}</span>
                            </button>
                        ))}
                    </div>
                )}
                <form onSubmit={handlePromptSubmit} className="ui-design-terminal-form">
                    <div className="ui-design-terminal-form-icon">
                        <Terminal className="w-4 h-4" />
                    </div>
                    <input 
                        ref={inputRef}
                        type="text"
                        value={promptText}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder={selectedEntity ? "Command @id #move /z+1" : "Type a syntax command or /help..."}
                        className="ui-design-terminal-input"
                        spellCheck={false}
                        autoComplete="off"
                    />
                    <button 
                        type="submit" 
                        disabled={!promptText.trim()}
                        className="ui-design-terminal-submit"
                    >
                        <Command className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
