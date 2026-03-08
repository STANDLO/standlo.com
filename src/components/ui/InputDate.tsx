"use client";

import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { inputVariants } from "@/components/ui/Input";

export interface InputDateProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export const InputDate = React.forwardRef<HTMLInputElement, InputDateProps>(
    ({ className, variant, label, error, id, containerClassName, ...props }, ref) => {
        const inputElement = (
            <div className="flex flex-col gap-1 w-full">
                <div className="relative w-full">
                    <input
                        id={id}
                        type="date"
                        className={cn(
                            inputVariants({ variant, className }),
                            error && "border-destructive focus-visible:ring-destructive",
                            // This hides the default icon but keeps it clickable acting as an overlay
                            "pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-10 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                        )}
                        ref={ref}
                        {...props}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                        <Calendar size={18} />
                    </div>
                </div>
                {error && <span className="text-xs text-destructive font-medium">{error}</span>}
            </div>
        );

        if (!label) {
            return inputElement;
        }

        return (
            <div className={cn("ui-input-wrapper", containerClassName)}>
                <label className="ui-input-label" htmlFor={id}>
                    {label}
                </label>
                {inputElement}
            </div>
        );
    }
);
InputDate.displayName = "InputDate";
