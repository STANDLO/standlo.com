"use client";

import * as React from "react";
import { Search, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputLookupProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    label?: string;
    error?: string;
    containerClassName?: string;

    // Controlled value
    value?: string | null;
    onChange?: (value: string | null) => void;

    // Lookup behaviour
    onSearch?: (query: string) => Promise<Array<{ id: string; label: string }>>;

    // Display value for the currently selected item (so you don't just see the ID)
    displayValue?: string;
}

const InputLookup = React.forwardRef<HTMLInputElement, InputLookupProps>(
    ({ className, label, error, containerClassName, value, onChange, onSearch, displayValue, disabled, placeholder = "Cerca...", ...props }, ref) => {

        const [isOpen, setIsOpen] = React.useState(false);
        const [query, setQuery] = React.useState("");
        const [results, setResults] = React.useState<Array<{ id: string; label: string }>>([]);
        const [isLoading, setIsLoading] = React.useState(false);

        const wrapperRef = React.useRef<HTMLDivElement>(null);

        // Chiude il dropdown se clicchi fuori
        React.useEffect(() => {
            function handleClickOutside(event: MouseEvent) {
                if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            }
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, [wrapperRef]);

        // Handle Search Debouncing internally or just fire the promise
        React.useEffect(() => {
            if (!isOpen || !onSearch) return;

            const executeSearch = async () => {
                setIsLoading(true);
                try {
                    const data = await onSearch(query);
                    setResults(data);
                } catch (err) {
                    console.error("Lookup search error", err);
                    setResults([]);
                } finally {
                    setIsLoading(false);
                }
            };

            const timeoutId = setTimeout(executeSearch, 300); // 300ms debounce
            return () => clearTimeout(timeoutId);
        }, [query, isOpen, onSearch]);

        const handleSelect = (id: string) => {
            if (onChange) onChange(id);
            setIsOpen(false);
            setQuery(""); // reset search
        };

        const handleClear = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (onChange) onChange(null);
        };

        return (
            <div className={cn("ui-input-wrapper relative", containerClassName)} ref={wrapperRef}>
                {label && <label className="ui-input-label">{label}</label>}

                <div
                    className={cn(
                        "relative flex items-center w-full rounded-md border text-sm shadow-sm transition-colors cursor-pointer",
                        disabled ? "bg-muted cursor-not-allowed opacity-70" : "bg-background hover:bg-accent/50",
                        error ? "border-destructive focus-within:ring-destructive" : "border-input focus-within:ring-ring",
                        className
                    )}
                    onClick={() => !disabled && setIsOpen(true)}
                >
                    {/* Se c'è un valore selezionato, mostralo. Altrimenti mostra l'input di ricerca se aperto, altrimenti vuoto/placeholder */}
                    {value && !isOpen ? (
                        <div className="flex-1 px-3 py-2 flex items-center justify-between">
                            <span className="truncate">{displayValue || value}</span>
                            <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground focus:outline-none"
                                onClick={handleClear}
                                disabled={disabled}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center px-3">
                            <Search className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                            <input
                                {...props}
                                ref={ref}
                                type="text"
                                className="w-full bg-transparent py-2 focus:outline-none placeholder:text-muted-foreground"
                                placeholder={placeholder}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                disabled={disabled}
                                onFocus={() => setIsOpen(true)}
                            />
                        </div>
                    )}
                </div>

                {/* Dropdown Results */}
                {isOpen && !disabled && (
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-4 text-muted-foreground">
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                <span>Ricerca...</span>
                            </div>
                        ) : results.length > 0 ? (
                            <ul className="py-1">
                                {results.map((item) => (
                                    <li
                                        key={item.id}
                                        className="px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                        onClick={() => handleSelect(item.id)}
                                    >
                                        {item.label}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Nessun risultato trovato.
                            </div>
                        )}
                    </div>
                )}

                {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            </div>
        );
    }
);

InputLookup.displayName = "InputLookup";
export { InputLookup };
