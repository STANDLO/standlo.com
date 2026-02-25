import * as React from "react"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { inputVariants } from "./Input"

export interface SelectOption {
    value: string
    label: string
}

export interface SelectProps
    extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof inputVariants> {
    label?: string
    error?: string
    options: SelectOption[]
    containerClassName?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, variant, label, error, id, containerClassName, options, ...props }, ref) => {
        const selectElement = (
            <div className="flex flex-col gap-1 w-full">
                <select
                    id={id}
                    className={cn(inputVariants({ variant, className }), error && "border-destructive focus-visible:ring-destructive")}
                    ref={ref}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && <span className="text-xs text-destructive font-medium">{error}</span>}
            </div>
        )

        if (!label) {
            return selectElement
        }

        return (
            <div className={cn("ui-input-wrapper", containerClassName)}>
                <label className="ui-input-label" htmlFor={id}>
                    {label}
                </label>
                {selectElement}
            </div>
        )
    }
)
Select.displayName = "Select"

export { Select }
