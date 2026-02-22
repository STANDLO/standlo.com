"use client";

import * as React from "react";
import { Textarea, TextareaProps } from "@/components/ui/Textarea";
import { LocalizedString } from "@/core/schemas";
import { cn } from "@/lib/utils";

interface TextareaLocalizedProps extends Omit<TextareaProps, "value" | "onChange"> {
    value?: LocalizedString;
    onChange?: (value: LocalizedString) => void;
    error?: string;
}

export function TextareaLocalized({ value, onChange, label, error, className, ...props }: TextareaLocalizedProps) {
    const [selectedLang, setSelectedLang] = React.useState<"it" | "en" | "es">("it");

    const internalValue = value || { it: "" };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = { ...internalValue, [selectedLang]: e.target.value };
        onChange?.(newValue);
    };

    return (
        <div className={cn("flex flex-col gap-1.5 w-full", className)}>
            {label && (
                <div className="flex items-center justify-between">
                    <label className="ui-input-label">
                        {label} {selectedLang === "it" && <span className="text-destructive">*</span>}
                    </label>
                    <div className="flex gap-1">
                        {(["it", "en", "es"] as const).map((lang) => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => setSelectedLang(lang)}
                                className={cn(
                                    "px-2 py-0.5 text-xs font-medium rounded-sm border uppercase transition-colors",
                                    selectedLang === lang
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-border hover:bg-accent"
                                )}
                            >
                                {lang}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <Textarea
                {...props}
                value={internalValue[selectedLang] || ""}
                onChange={handleTextareaChange}
                error={error}
                required={props.required && selectedLang === "it"} // Only strictly required in IT
            />
        </div>
    );
}
