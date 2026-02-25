import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode;
    containerClassName?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className, label, containerClassName, id, disabled, ...props }, ref) => {
        return (
            <div className={cn("ui-checkbox-container", containerClassName)}>
                <input
                    type="checkbox"
                    className={cn("ui-checkbox-input", className)}
                    ref={ref}
                    id={id}
                    disabled={disabled}
                    {...props}
                />
                {label && (
                    <span className="ui-checkbox-text cursor-default">
                        {label}
                    </span>
                )}
            </div>
        );
    }
);

Checkbox.displayName = "Checkbox";
