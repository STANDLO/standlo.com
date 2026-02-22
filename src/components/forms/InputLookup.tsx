"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface InputLookupProps {
    value: string | null;
    onChange: (value: string | null) => void;
    target: string; // The Firestore collection to lookup (e.g., 'organizations')
    placeholder?: string;
    disabled?: boolean;
    readOnly?: boolean;
}

export function InputLookup({
    value,
    onChange,
    target,
    placeholder,
    disabled,
    readOnly
}: InputLookupProps) {
    const t = useTranslations("Common");
    const [isOpen, setIsOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");

    // Simulated lookup logic. In a real app this would trigger an API search endpoint
    // based on the `target` collection prop
    React.useEffect(() => {
        if (isOpen) {
            console.log(`Searching against collection: ${target} for query: ${query}`);
        }
    }, [isOpen, query, target]);

    const mockResults = [
        { id: "lookup-1", name: "Result 1" },
        { id: "lookup-2", name: "Result 2" },
    ];

    const displayValue = value ? `Selected: ${value}` : "";

    return (
        <div className="ui-lookup-container">
            <div className="ui-lookup-trigger">
                <Input
                    value={displayValue}
                    readOnly
                    placeholder={placeholder || t("search", { fallback: "Cerca..." })}
                    disabled={disabled}
                    className="ui-lookup-input"
                    onClick={() => {
                        if (!disabled && !readOnly) setIsOpen(true);
                    }}
                />
                {!readOnly && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        disabled={disabled}
                        onClick={() => setIsOpen(true)}
                    >
                        <Search className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {isOpen && (
                <div className="ui-lookup-popover">
                    <div className="ui-lookup-searchbar">
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Type to search..."
                            className="ui-lookup-search-input"
                            autoFocus
                        />
                    </div>
                    <div className="ui-lookup-results">
                        {mockResults.map(res => (
                            <div
                                key={res.id}
                                className="ui-lookup-item"
                                onClick={() => {
                                    onChange(res.id);
                                    setIsOpen(false);
                                    setQuery("");
                                }}
                            >
                                {res.name}
                            </div>
                        ))}
                    </div>
                    <div className="ui-lookup-footer">
                        <Button variant="secondaryMuted" className="ui-lookup-btn" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
