import React, { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Terminal, Command, X } from "lucide-react";
import { DesignController } from "@/lib/design";
import { useDesignStore } from "@/lib/zustand";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import pkg from "../../../../package.json";
import { DesignTools as PDMTools } from "../../../../functions/src/core/constants";

type LocalPDMTool = {
    id: string;
    name: string;
    group: string;
    terminalCommand?: string;
    description: string;
    order?: number;
    [key: string]: unknown;
};

export function DesignTerminal() {
    const t = useTranslations("Design.tools");
    const tHelp = useTranslations("Design.terminalHelp");
    const [promptText, setPromptText] = useState("");
    const [history, setHistory] = useState<string[]>([]);
    const [isHelpExpanded, setIsHelpExpanded] = useState(false);
    
    // Autocomplete UI State
    const [suggestions, setSuggestions] = useState<{label: string; value: string}[]>([]);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const params = useParams();
    const designId = (params?.uid as string) || (params?.id as string) || (params?.entity as string);

    const entities = useDesignStore(state => state.entities);
    const selectedEntityId = useDesignStore(state => state.selectedEntityId);
    const liveCommand = useDesignStore(state => state.liveCommand);
    const selectEntity = useDesignStore(state => state.selectEntity);
    const selectedEntity = selectedEntityId ? entities[selectedEntityId] : null;

    // Auto-sync liveCommand into the input box to show "Ghost Typing"
    useEffect(() => {
        if (liveCommand) {
            setPromptText(liveCommand);
        }
    }, [liveCommand]);

    // Clear terminal if clicking outside and no entity selected
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!selectedEntityId && promptText && !inputRef.current?.contains(e.target as Node)) {
                // Ensure we don't clear if they are clicking a suggestion
                const target = e.target as HTMLElement;
                if (!target.closest('.ui-design-terminal-suggestions-container')) {
                    setPromptText("");
                }
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedEntityId, promptText]);

    // Populate prompt when clicking entity in 3D
    useEffect(() => {
        if (selectedEntityId && !promptText.includes(`@${selectedEntityId}`)) {
            setPromptText(prev => {
                // If there's already an @target, replace the FIRST one found
                if (prev.includes('@')) {
                    return prev.replace(/@[^\s]+/, `@${selectedEntityId}`);
                }
                // Otherwise prepend it
                return `@${selectedEntityId} ${prev}`.trim();
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEntityId]);

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
        } else if (lastWord.startsWith("#") || lastWord.startsWith("&")) {
            const prefix = lastWord[0];
            
            const search = lastWord.slice(1).toLowerCase();
            
            // & triggers all tools that are not 'edit', # triggers 'edit' 
            const filterFn = (t: LocalPDMTool) => prefix === "&" ? t.group !== "edit" : t.group === "edit";

            const tools = Object.values(PDMTools)
                .filter(filterFn)
                .map((t: LocalPDMTool) => ({ 
                    label: t.name.split('.').pop() || t.id, 
                    value: `${prefix}${t.terminalCommand || t.id}` 
                }));
                
            const all = tools.filter(t => t.value.toLowerCase().includes(search));
            setSuggestions(all.slice(0, 25));
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
            if (token === "--help") {
                action = "--help";
            } else if (token.startsWith("@")) {
                const targetNameOrId = token.substring(1);
                // Try matching exact ID first, then try name match (case-insensitive partial)
                if (entities[targetNameOrId]) {
                    targets.push(targetNameOrId);
                } else {
                    const matchedEntity = Object.values(entities).find(e => 
                        e.id.toLowerCase().includes(targetNameOrId.toLowerCase()) || 
                        (e.metadata?.name && String(e.metadata.name).toLowerCase().includes(targetNameOrId.toLowerCase()))
                    );
                    if (matchedEntity) targets.push(matchedEntity.id);
                    else targets.push(targetNameOrId); // Fallback: keep original if not found
                }
            } else if (token.startsWith("#") || token.startsWith("&")) {
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
            const matchedTool = Object.values(PDMTools).find((t: LocalPDMTool) => 
                (t.terminalCommand?.toLowerCase() === action || t.id.toLowerCase() === action)
            );

            // Automatically execute UI tool dispatcher if mapped, EXCEPT for 'move' and 'delete'
            // where the Terminal has special multi-target numeric math capability.
            if (matchedTool && !["move", "delete"].includes(action)) {
                DesignController.executeToolCommand(matchedTool.id, designId as string);
                setHistory(prev => [...prev, `[OK] Triggered ${t(matchedTool.name.split('.').pop() || matchedTool.id)}`]);
                return;
            }

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
                    setHistory(prev => [...prev, `[WARNING] #add pending catalog Vector Search query for: ${query} of type ${type}`]);
                    break;
                }
                case "--help": {
                    setIsHelpExpanded(true);
                    setHistory(prev => [...prev, tHelp("header", { version: pkg.version })]);
                    setHistory(prev => [...prev, tHelp("syntax")]);
                    setHistory(prev => [...prev, ``]);
                    setHistory(prev => [...prev, tHelp("actionsHeader")]);
                    setHistory(prev => [...prev, `  ${tHelp("actionMove")}`]);
                    setHistory(prev => [...prev, `  ${tHelp("actionDelete")}`]);
                    setHistory(prev => [...prev, ``]);
                    setHistory(prev => [...prev, tHelp("dynamicToolsHeader")]);
                    Object.values(PDMTools)
                        .sort((a, b) => ((a as LocalPDMTool).order || 0) - ((b as LocalPDMTool).order || 0))
                        .forEach(pdmTool => {
                        const tool = pdmTool as LocalPDMTool;
                        const translationKeyName = tool.name.split('.').pop() || tool.id;
                        const descTranslationKey = tool.description.split('.').pop() || "";
                        
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const toolName = t(translationKeyName as any);
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const desc = descTranslationKey ? t(descTranslationKey as any) : tool.description;
                        
                        const prefix = tool.group === "edit" ? "#" : "&";
                        const cmd = tool.terminalCommand || tool.id;
                        setHistory(prev => [...prev, `  **${prefix}${cmd.padEnd(10)}** - ${toolName}: ${desc}`]);
                    });
                    setHistory(prev => [...prev, ``]);
                    setHistory(prev => [...prev, tHelp("examplesHeader")]);
                    setHistory(prev => [...prev, `  ${tHelp("exampleMove")}`]);
                    setHistory(prev => [...prev, `  ${tHelp("exampleSketch")}`]);
                    setHistory(prev => [...prev, `  ${tHelp("exampleScroll")}`]);
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
                <div className={`ui-design-terminal-history relative pointer-events-auto transition-all duration-300 ${isHelpExpanded ? '!max-h-[calc(100vh-16rem)]' : ''}`}>
                    {isHelpExpanded && (
                        <button 
                            type="button"
                            className="absolute top-2 right-4 p-1 rounded-full bg-background/80 hover:bg-muted border border-border/50 text-foreground/50 hover:text-foreground shadow-sm z-10 transition-colors cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsHelpExpanded(false);
                                setHistory(prev => [...prev, "[OK] Trigger Help"]);
                            }}
                            title="Close Help"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    {history.slice(isHelpExpanded ? -50 : -1).map((line, i) => (
                        <div key={i} className={`${line.startsWith('>') ? 'ui-design-terminal-history-item-echo' : line.includes('[ERROR]') ? 'ui-design-terminal-history-item-error' : line.includes('[OK]') ? 'ui-design-terminal-history-item-success' : line.includes('[WARNING]') ? 'ui-design-terminal-history-item-warning' : 'ui-design-terminal-history-item'} whitespace-nowrap overflow-hidden text-ellipsis block max-w-full`}>
                            {line.split('**').map((part, idx) => idx % 2 === 1 ? <strong key={idx}>{part}</strong> : part)}
                        </div>
                    ))}
                </div>
            )}

            {selectedEntity && (
                <div className="ui-design-terminal-target">
                    <div className="ui-design-terminal-target-wrapper">
                        <div className="ui-design-terminal-target-badge">
                            TARGET: {selectedEntity.metadata?.name || selectedEntity.baseEntityId} (ID: {selectedEntity.id.split('-')[0]})
                        </div>
                        <div className="ui-design-terminal-target-pos">
                            POS: [{selectedEntity.position.map(n => n.toFixed(3)).join(', ')}]
                        </div>
                    </div>
                </div>
            )}
            
            <div className="ui-design-terminal-input-wrapper">
                {showSuggestions && suggestions.length > 0 && (
                    <div className="ui-design-terminal-suggestions-container">
                        {suggestions.map((s, i) => (
                            <button
                                key={s.value}
                                type="button"
                                className={`ui-design-terminal-suggestion ${i === suggestionIndex ? 'ui-design-terminal-suggestion-active' : 'ui-design-terminal-suggestion-inactive'}`}
                                onClick={() => applySuggestion(s.value)}
                            >
                                <span className="ui-design-terminal-suggestion-value">{s.value}</span> <span className="ui-design-terminal-suggestion-label">{s.label}</span>
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
                        placeholder={selectedEntity ? "Command @id #move /z+1" : "Type a syntax command or --help..."}
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
